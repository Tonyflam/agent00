const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${API_URL}/api`;

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard`);
  return res.json();
}

export async function fetchAgents(capability?: string) {
  const url = capability ? `${API_URL}/agents?capability=${capability}` : `${API_URL}/agents`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/commerce/sessions`);
  return res.json();
}

export async function fetchPayments() {
  const res = await fetch(`${API_BASE}/payments`);
  return res.json();
}

export async function executeTask(task: string, capability: string, budget?: number) {
  const res = await fetch(`${API_BASE}/commerce/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, capability, budget: budget || 0.05, clientName: 'WebUser' }),
  });
  return res.json();
}

export async function startDemo(interval?: number) {
  const res = await fetch(`${API_BASE}/demo/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interval: interval || 15000 }),
  });
  return res.json();
}

export async function stopDemo() {
  const res = await fetch(`${API_BASE}/demo/stop`, { method: 'POST' });
  return res.json();
}

export async function discoverAgents(capability: string) {
  const res = await fetch(`${API_URL}/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capability }),
  });
  return res.json();
}

export async function fetchBlockchainStatus(): Promise<BlockchainStatus> {
  const res = await fetch(`${API_BASE}/blockchain/status`);
  return res.json();
}

export function createWebSocket(): WebSocket {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  let wsUrl: string;
  if (apiUrl) {
    // External API — derive WebSocket URL from it
    const url = new URL(apiUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${url.host}/ws`;
  } else {
    // Same origin (dev proxy)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${window.location.host}/ws`;
  }
  return new WebSocket(wsUrl);
}

// Types
export interface DashboardData {
  overview: {
    totalAgents: number;
    activeAgents: number;
    totalSkills: number;
    averageReputation: number;
    activeSessions: number;
    completedSessions: number;
    totalTransactions: number;
    totalVolume: string;
    totalNegotiations: number;
    avgNegotiationRounds: string;
  };
  agents: AgentSummary[];
  recentSessions: SessionData[];
  recentPayments: PaymentData[];
  network: {
    name: string;
    chainId: number;
    rpcUrl: string;
    gasless: boolean;
  };
  protocols: {
    x402: { enabled: boolean; facilitator: string };
    a2a: { enabled: boolean; endpoint: string };
    erc8004: { enabled: boolean; registries: Record<string, string> };
  };
}

export interface AgentSummary {
  id: string;
  name: string;
  description: string;
  skills: { id: string; name: string; price: string }[];
  reputation: { score: number; totalJobs: number; successRate: number };
  status: string;
  transactions: number;
  earnings: string;
  erc8004Id?: number;
}

export interface SessionData {
  id: string;
  clientAgentId: string;
  serviceAgentId: string;
  taskDescription: string;
  status: string;
  negotiation: NegotiationMsg[];
  agreedPrice?: number;
  result?: string;
  createdAt: number;
  completedAt?: number;
  duration?: number;
}

export interface NegotiationMsg {
  from: string;
  to: string;
  type: string;
  content: string;
  priceProposal?: number;
  timestamp: number;
}

export interface PaymentData {
  id: string;
  route: string;
  amount: string;
  payer: string;
  payee: string;
  network: string;
  txHash: string;
  timestamp: number;
  agentId?: number;
  status: string;
}

export interface BlockchainStatus {
  connected: boolean;
  chainId: number | null;
  blockNumber: number | null;
  contracts: {
    identity: { deployed: boolean; address: string };
    reputation: { deployed: boolean; address: string };
    escrow: { deployed: boolean; address: string };
  };
}
