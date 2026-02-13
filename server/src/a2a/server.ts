/**
 * NEXUS A2A (Agent-to-Agent) Protocol Server
 * 
 * Implements Google's Agent2Agent protocol for agent discovery
 * and capability advertisement. Each NEXUS agent publishes an
 * Agent Card at /.well-known/agent.json following the A2A spec.
 * 
 * Features:
 * - Agent card generation and serving
 * - Capability-based agent discovery
 * - Task lifecycle management (JSON-RPC 2.0)
 * - Agent skill matching
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { registerAgentOnChain } from '../blockchain/erc8004';

// ═══════════════════════════════════════════════════════
//                   A2A TYPES
// ═══════════════════════════════════════════════════════

export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: AgentCapability[];
  skills: AgentSkill[];
  authentication: {
    schemes: string[];
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  provider?: {
    organization: string;
    url: string;
  };
  x402Support?: {
    enabled: boolean;
    network: string;
    payTo: string;
  };
  erc8004?: {
    agentId: number;
    registry: string;
    chainId: number;
  };
}

export interface AgentCapability {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
  price?: string;
}

export interface A2ATask {
  id: string;
  status: 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled';
  artifacts: A2AArtifact[];
  history: A2AMessage[];
  metadata?: Record<string, any>;
}

export interface A2AMessage {
  role: 'user' | 'agent';
  parts: A2APart[];
  timestamp?: string;
}

export interface A2APart {
  type: 'text' | 'data' | 'file';
  text?: string;
  data?: any;
  mimeType?: string;
}

export interface A2AArtifact {
  name: string;
  parts: A2APart[];
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════
//              AGENT REGISTRY (IN-MEMORY)
// ═══════════════════════════════════════════════════════

export interface RegisteredAgent {
  id: string;
  agentCard: AgentCard;
  erc8004Id?: number;
  reputation: {
    score: number;
    totalJobs: number;
    successRate: number;
  };
  status: 'active' | 'busy' | 'offline';
  lastSeen: number;
  transactions: number;
  earnings: number;
}

class AgentDirectory {
  private agents: Map<string, RegisteredAgent> = new Map();

  register(agent: RegisteredAgent): void {
    this.agents.set(agent.id, agent);
  }

  get(id: string): RegisteredAgent | undefined {
    return this.agents.get(id);
  }

  getAll(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  getActive(): RegisteredAgent[] {
    return this.getAll().filter(a => a.status === 'active');
  }

  findByCapability(capability: string): RegisteredAgent[] {
    return this.getActive().filter(agent =>
      agent.agentCard.skills.some(skill =>
        skill.tags.includes(capability) ||
        skill.name.toLowerCase().includes(capability.toLowerCase()) ||
        skill.description.toLowerCase().includes(capability.toLowerCase())
      )
    );
  }

  findBySkill(skillId: string): RegisteredAgent[] {
    return this.getActive().filter(agent =>
      agent.agentCard.skills.some(skill => skill.id === skillId)
    );
  }

  updateStatus(id: string, status: 'active' | 'busy' | 'offline'): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      agent.lastSeen = Date.now();
    }
  }

  getStats() {
    const agents = this.getAll();
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      busyAgents: agents.filter(a => a.status === 'busy').length,
      totalSkills: agents.reduce((sum, a) => sum + a.agentCard.skills.length, 0),
      averageReputation: agents.length > 0 
        ? agents.reduce((sum, a) => sum + a.reputation.score, 0) / agents.length 
        : 0,
    };
  }
}

export const agentDirectory = new AgentDirectory();

// ═══════════════════════════════════════════════════════
//              TASK MANAGER
// ═══════════════════════════════════════════════════════

class TaskManager {
  private tasks: Map<string, A2ATask> = new Map();

  create(initialMessage?: A2AMessage): A2ATask {
    const task: A2ATask = {
      id: uuidv4(),
      status: 'submitted',
      artifacts: [],
      history: initialMessage ? [initialMessage] : [],
    };
    this.tasks.set(task.id, task);
    return task;
  }

  get(id: string): A2ATask | undefined {
    return this.tasks.get(id);
  }

  update(id: string, updates: Partial<A2ATask>): A2ATask | undefined {
    const task = this.tasks.get(id);
    if (task) {
      Object.assign(task, updates);
      return task;
    }
    return undefined;
  }

  getAll(): A2ATask[] {
    return Array.from(this.tasks.values());
  }

  getRecent(count: number): A2ATask[] {
    return this.getAll().slice(-count);
  }
}

export const taskManager = new TaskManager();

// ═══════════════════════════════════════════════════════
//          SEED DEFAULT AGENTS
// ═══════════════════════════════════════════════════════

export function seedDefaultAgents(baseUrl: string): void {
  const payToAddress = process.env.PAYMENT_WALLET_ADDRESS || '0x7b4bCB5EC56D2CB3f5E5D89C600F8e238FDC19A6';
  
  const defaultAgents: Omit<RegisteredAgent, 'id'>[] = [
    {
      agentCard: {
        name: 'DataSense',
        description: 'Advanced data analysis AI agent. Processes datasets, generates insights, creates statistical reports, and identifies patterns using machine learning.',
        url: `${baseUrl}/agents/datasense`,
        version: '1.0.0',
        capabilities: [{ streaming: true, pushNotifications: false, stateTransitionHistory: true }],
        skills: [
          {
            id: 'data-analysis',
            name: 'Data Analysis',
            description: 'Analyze datasets and generate statistical insights, trends, and visualizations',
            tags: ['data', 'analytics', 'statistics', 'ml', 'insights'],
            examples: ['Analyze this sales data and find trends', 'Generate a statistical report'],
            price: '$0.005',
          },
          {
            id: 'pattern-recognition',
            name: 'Pattern Recognition',
            description: 'Identify patterns and anomalies in structured and unstructured data',
            tags: ['patterns', 'anomalies', 'detection', 'ml'],
            price: '$0.008',
          },
        ],
        authentication: { schemes: ['x402', 'bearer'] },
        defaultInputModes: ['text', 'application/json'],
        defaultOutputModes: ['text', 'application/json'],
        provider: { organization: 'NEXUS Commerce', url: baseUrl },
        x402Support: { enabled: true, network: 'eip155:103698795', payTo: payToAddress },
      },
      reputation: { score: 50, totalJobs: 0, successRate: 1.0 },
      status: 'active',
      lastSeen: Date.now(),
      transactions: 0,
      earnings: 0,
    },
    {
      agentCard: {
        name: 'ContentForge',
        description: 'Professional content creation AI agent. Writes articles, marketing copy, technical documentation, and creative content with SEO optimization.',
        url: `${baseUrl}/agents/contentforge`,
        version: '1.0.0',
        capabilities: [{ streaming: true, pushNotifications: false, stateTransitionHistory: true }],
        skills: [
          {
            id: 'content-writing',
            name: 'Content Writing',
            description: 'Write high-quality articles, blog posts, marketing copy, and documentation',
            tags: ['writing', 'content', 'articles', 'copywriting', 'seo'],
            examples: ['Write a blog post about AI agents', 'Create marketing copy for a product'],
            price: '$0.01',
          },
          {
            id: 'summarization',
            name: 'Text Summarization',
            description: 'Summarize long texts, documents, and research papers',
            tags: ['summary', 'condensing', 'tldr', 'research'],
            price: '$0.003',
          },
        ],
        authentication: { schemes: ['x402', 'bearer'] },
        defaultInputModes: ['text'],
        defaultOutputModes: ['text', 'text/markdown'],
        provider: { organization: 'NEXUS Commerce', url: baseUrl },
        x402Support: { enabled: true, network: 'eip155:103698795', payTo: payToAddress },
      },
      reputation: { score: 50, totalJobs: 0, successRate: 1.0 },
      status: 'active',
      lastSeen: Date.now(),
      transactions: 0,
      earnings: 0,
    },
    {
      agentCard: {
        name: 'CodeAudit',
        description: 'Expert code review and audit AI agent. Reviews code for bugs, security vulnerabilities, performance issues, and best practices compliance.',
        url: `${baseUrl}/agents/codeaudit`,
        version: '1.0.0',
        capabilities: [{ streaming: true, pushNotifications: true, stateTransitionHistory: true }],
        skills: [
          {
            id: 'code-review',
            name: 'Code Review',
            description: 'Review code for bugs, security issues, and best practices',
            tags: ['code', 'review', 'audit', 'security', 'bugs'],
            examples: ['Review this smart contract for vulnerabilities', 'Audit this API endpoint'],
            price: '$0.015',
          },
          {
            id: 'code-optimization',
            name: 'Code Optimization',
            description: 'Optimize code for performance, gas efficiency, and readability',
            tags: ['optimization', 'performance', 'gas', 'refactoring'],
            price: '$0.012',
          },
        ],
        authentication: { schemes: ['x402', 'bearer'] },
        defaultInputModes: ['text', 'application/json'],
        defaultOutputModes: ['text', 'text/markdown', 'application/json'],
        provider: { organization: 'NEXUS Commerce', url: baseUrl },
        x402Support: { enabled: true, network: 'eip155:103698795', payTo: payToAddress },
      },
      reputation: { score: 50, totalJobs: 0, successRate: 1.0 },
      status: 'active',
      lastSeen: Date.now(),
      transactions: 0,
      earnings: 0,
    },
    {
      agentCard: {
        name: 'MarketOracle',
        description: 'Real-time market research and competitive analysis AI agent. Provides market insights, competitor analysis, trend forecasting, and strategic recommendations.',
        url: `${baseUrl}/agents/marketoracle`,
        version: '1.0.0',
        capabilities: [{ streaming: true, pushNotifications: true, stateTransitionHistory: true }],
        skills: [
          {
            id: 'market-research',
            name: 'Market Research',
            description: 'Research markets, competitors, and industry trends with actionable insights',
            tags: ['market', 'research', 'competitors', 'trends', 'strategy'],
            examples: ['Analyze the DeFi market', 'Research competitors in the AI agent space'],
            price: '$0.02',
          },
          {
            id: 'sentiment-analysis',
            name: 'Sentiment Analysis',
            description: 'Analyze market sentiment from news, social media, and community signals',
            tags: ['sentiment', 'news', 'social', 'community'],
            price: '$0.008',
          },
        ],
        authentication: { schemes: ['x402', 'bearer'] },
        defaultInputModes: ['text'],
        defaultOutputModes: ['text', 'application/json'],
        provider: { organization: 'NEXUS Commerce', url: baseUrl },
        x402Support: { enabled: true, network: 'eip155:103698795', payTo: payToAddress },
      },
      reputation: { score: 50, totalJobs: 0, successRate: 1.0 },
      status: 'active',
      lastSeen: Date.now(),
      transactions: 0,
      earnings: 0,
    },
    {
      agentCard: {
        name: 'LinguaAgent',
        description: 'Professional translation and localization AI agent. Supports 50+ languages with context-aware translation, cultural adaptation, and terminology management.',
        url: `${baseUrl}/agents/linguaagent`,
        version: '1.0.0',
        capabilities: [{ streaming: true, pushNotifications: false, stateTransitionHistory: true }],
        skills: [
          {
            id: 'translation',
            name: 'Translation',
            description: 'Translate text between 50+ languages with context-aware accuracy',
            tags: ['translation', 'languages', 'localization', 'i18n'],
            examples: ['Translate this document to Spanish', 'Localize this UI text for Japanese market'],
            price: '$0.004',
          },
          {
            id: 'language-detection',
            name: 'Language Detection',
            description: 'Detect the language of text with confidence scoring',
            tags: ['detection', 'language', 'identification'],
            price: '$0.001',
          },
        ],
        authentication: { schemes: ['x402', 'bearer'] },
        defaultInputModes: ['text'],
        defaultOutputModes: ['text'],
        provider: { organization: 'NEXUS Commerce', url: baseUrl },
        x402Support: { enabled: true, network: 'eip155:103698795', payTo: payToAddress },
      },
      reputation: { score: 50, totalJobs: 0, successRate: 1.0 },
      status: 'active',
      lastSeen: Date.now(),
      transactions: 0,
      earnings: 0,
    },
  ];

  defaultAgents.forEach((agent, idx) => {
    const id = `agent-${idx + 1}-${uuidv4().slice(0, 8)}`;
    agentDirectory.register({ ...agent, id });

    // Attempt on-chain registration (non-blocking)
    const agentName = agent.agentCard.name;
    const agentURI = agent.agentCard.url;
    const caps = agent.agentCard.skills.flatMap(s => s.tags);
    registerAgentOnChain(agentName, agentURI, caps).then(result => {
      const registered = agentDirectory.get(id);
      if (registered) {
        registered.agentCard.erc8004 = {
          agentId: result.agentId,
          registry: result.onChain ? (process.env.IDENTITY_REGISTRY_ADDRESS || '') : 'demo',
          chainId: 103698795,
        };
        registered.erc8004Id = result.agentId;
      }
      if (result.onChain) {
        console.log(`🔗 ${agentName} → on-chain ID #${result.agentId}`);
      }
    }).catch(() => {});
  });
}

// ═══════════════════════════════════════════════════════
//              A2A ROUTER
// ═══════════════════════════════════════════════════════

export function createA2ARouter(baseUrl: string): Router {
  const router = Router();

  // ── Agent Card Discovery ──────────────────────────
  // Standard A2A endpoint for agent discovery
  router.get('/.well-known/agent.json', (req: Request, res: Response) => {
    const platformCard: AgentCard = {
      name: 'NEXUS Commerce Platform',
      description: 'Autonomous Agent Commerce Network — discover, negotiate, and transact with AI service agents via x402 payments on SKALE blockchain.',
      url: baseUrl,
      version: '1.0.0',
      capabilities: [{ streaming: true, pushNotifications: true, stateTransitionHistory: true }],
      skills: [
        {
          id: 'agent-discovery',
          name: 'Agent Discovery',
          description: 'Discover and match AI service agents based on capability requirements',
          tags: ['discovery', 'matching', 'agents'],
        },
        {
          id: 'commerce-orchestration',
          name: 'Commerce Orchestration',
          description: 'Orchestrate multi-agent commerce workflows with autonomous negotiation and payment',
          tags: ['commerce', 'orchestration', 'negotiation', 'payment'],
        },
      ],
      authentication: { schemes: ['x402', 'bearer', 'none'] },
      defaultInputModes: ['text', 'application/json'],
      defaultOutputModes: ['text', 'application/json'],
      provider: { organization: 'NEXUS Protocol', url: baseUrl },
      x402Support: { enabled: true, network: 'eip155:103698795', payTo: process.env.PAYMENT_WALLET_ADDRESS || '0x7b4bCB5EC56D2CB3f5E5D89C600F8e238FDC19A6' },
    };
    res.json(platformCard);
  });

  // ── Agent Directory ───────────────────────────────
  router.get('/agents', (req: Request, res: Response) => {
    const capability = req.query.capability as string;
    const agents = capability
      ? agentDirectory.findByCapability(capability)
      : agentDirectory.getAll();
    
    res.json({
      agents: agents.map(a => ({
        id: a.id,
        name: a.agentCard.name,
        description: a.agentCard.description,
        skills: a.agentCard.skills,
        reputation: a.reputation,
        status: a.status,
        x402Support: a.agentCard.x402Support,
        erc8004: a.agentCard.erc8004,
        transactions: a.transactions,
        earnings: a.earnings,
      })),
      count: agents.length,
    });
  });

  // ── Individual Agent Card ──────────────────────────
  router.get('/agents/:agentId', (req: Request, res: Response) => {
    const agent = agentDirectory.get(req.params.agentId);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json(agent);
  });

  // ── Agent Card for specific agent (A2A compliant) ──
  router.get('/agents/:agentId/.well-known/agent.json', (req: Request, res: Response) => {
    const agent = agentDirectory.get(req.params.agentId);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json(agent.agentCard);
  });

  // ── Discover agents by skill ──────────────────────
  router.post('/discover', (req: Request, res: Response) => {
    const { capability, skill, minReputation } = req.body || {};
    
    let agents = agentDirectory.getActive();
    
    if (capability) {
      agents = agentDirectory.findByCapability(capability);
    }
    if (skill) {
      agents = agents.filter(a => 
        a.agentCard.skills.some(s => s.id === skill)
      );
    }
    if (minReputation) {
      agents = agents.filter(a => a.reputation.score >= minReputation);
    }

    res.json({
      discovered: agents.map(a => ({
        id: a.id,
        card: a.agentCard,
        reputation: a.reputation,
        status: a.status,
      })),
      count: agents.length,
    });
  });

  // ── A2A Task Management (JSON-RPC 2.0) ────────────
  router.post('/a2a', (req: Request, res: Response) => {
    const { jsonrpc, method, params, id } = req.body;

    if (jsonrpc !== '2.0') {
      res.status(400).json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id });
      return;
    }

    switch (method) {
      case 'tasks/send': {
        const task = taskManager.create({
          role: 'user',
          parts: [{ type: 'text', text: params?.message || '' }],
          timestamp: new Date().toISOString(),
        });
        res.json({ jsonrpc: '2.0', result: { task }, id });
        break;
      }
      case 'tasks/get': {
        const task = taskManager.get(params?.id);
        if (!task) {
          res.json({ jsonrpc: '2.0', error: { code: -32602, message: 'Task not found' }, id });
          return;
        }
        res.json({ jsonrpc: '2.0', result: { task }, id });
        break;
      }
      case 'tasks/cancel': {
        const task = taskManager.update(params?.id, { status: 'canceled' });
        res.json({ jsonrpc: '2.0', result: { task }, id });
        break;
      }
      default:
        res.json({ jsonrpc: '2.0', error: { code: -32601, message: 'Method not found' }, id });
    }
  });

  // ── Stats ─────────────────────────────────────────
  router.get('/stats', (req: Request, res: Response) => {
    res.json(agentDirectory.getStats());
  });

  return router;
}
