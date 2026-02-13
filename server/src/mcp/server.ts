/**
 * NEXUS MCP Server — Model Context Protocol Integration
 * 
 * Exposes the NEXUS autonomous agent commerce network as native
 * AI tools for Claude Desktop, Cursor, VS Code Copilot, and any
 * MCP-compatible client.
 * 
 * Tools:
 * 1. discover_agents      — Find agents by capability in the NEXUS network
 * 2. execute_task          — Run a full commerce session (discover → negotiate → pay → deliver)
 * 3. get_agent_info        — Get detailed info about a specific agent
 * 4. negotiate_price       — Start a price negotiation with an agent
 * 5. get_network_status    — Get NEXUS network health and stats
 * 6. list_capabilities     — List all available capabilities in the network
 * 7. get_session_history   — View past commerce sessions and negotiations
 * 8. get_payment_history   — View x402 payment ledger
 * 
 * This makes NEXUS the ONLY hackathon project that works natively
 * inside AI development environments.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const NEXUS_API_BASE = process.env.NEXUS_API_URL || 'http://localhost:3001';

// ═══════════════════════════════════════════════════════
//              MCP SERVER SETUP
// ═══════════════════════════════════════════════════════

const server = new McpServer({
  name: 'nexus-agent-commerce',
  version: '1.0.0',
});

// ═══════════════════════════════════════════════════════
//              TOOL: DISCOVER AGENTS
// ═══════════════════════════════════════════════════════

server.tool(
  'discover_agents',
  'Discover AI agents in the NEXUS network by capability. Agents are registered via ERC-8004 and discoverable via Google A2A protocol.',
  {
    capability: z.string().describe('The capability to search for (e.g., "data", "writing", "code", "market", "translation")'),
  },
  async ({ capability }) => {
    try {
      const res = await fetch(`${NEXUS_API_BASE}/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capability }),
      });
      const data = await res.json();
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            found: data.agents?.length || 0,
            agents: data.agents?.map((a: any) => ({
              name: a.agentCard?.name || a.name,
              id: a.id,
              skills: a.agentCard?.skills || a.skills,
              reputation: a.reputation,
              status: a.status,
              erc8004Id: a.agentCard?.erc8004?.agentId,
            })),
            protocols: ['A2A (Google)', 'ERC-8004', 'x402'],
            network: 'SKALE BITE V2 Sandbox (gasless)',
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text' as const, text: `Error discovering agents: ${error}` }] };
    }
  }
);

// ═══════════════════════════════════════════════════════
//              TOOL: EXECUTE TASK
// ═══════════════════════════════════════════════════════

server.tool(
  'execute_task',
  'Execute a full autonomous commerce session on the NEXUS network. An AI agent will be discovered, price negotiated via Gemini AI, payment processed via x402, and the task delivered.',
  {
    task: z.string().describe('Description of the task to execute'),
    capability: z.string().describe('Required capability (data, writing, code, market, translation)'),
    budget: z.number().optional().describe('Maximum budget in USD (default: 0.05)'),
  },
  async ({ task, capability, budget }) => {
    try {
      const res = await fetch(`${NEXUS_API_BASE}/api/commerce/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, capability, budget: budget || 0.05, clientName: 'MCP-Client' }),
      });
      const session = await res.json();

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            sessionId: session.id,
            status: session.status,
            agent: session.serviceAgentId,
            agreedPrice: session.agreedPrice,
            negotiationRounds: session.negotiation?.length || 0,
            duration: session.duration ? `${(session.duration / 1000).toFixed(1)}s` : undefined,
            result: session.result,
            payment: {
              protocol: 'x402',
              network: 'SKALE (gasless)',
              paymentId: session.paymentId,
            },
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text' as const, text: `Error executing task: ${error}` }] };
    }
  }
);

// ═══════════════════════════════════════════════════════
//              TOOL: GET AGENT INFO
// ═══════════════════════════════════════════════════════

server.tool(
  'get_agent_info',
  'Get detailed information about a specific AI agent in the NEXUS network, including its A2A agent card, skills, reputation, and ERC-8004 identity.',
  {
    agentId: z.string().describe('The ID of the agent to look up'),
  },
  async ({ agentId }) => {
    try {
      const res = await fetch(`${NEXUS_API_BASE}/agents/${agentId}`);
      const agent = await res.json();

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            ...agent,
            protocols: {
              a2a: `${NEXUS_API_BASE}/agents/${agentId}/.well-known/agent.json`,
              x402: agent.agentCard?.x402Support ? 'Enabled' : 'Disabled',
              erc8004: agent.agentCard?.erc8004 || 'Not registered',
            },
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text' as const, text: `Error fetching agent: ${error}` }] };
    }
  }
);

// ═══════════════════════════════════════════════════════
//              TOOL: NETWORK STATUS
// ═══════════════════════════════════════════════════════

server.tool(
  'get_network_status',
  'Get the current status of the NEXUS agent commerce network including agent count, active sessions, transaction volume, and protocol health.',
  {},
  async () => {
    try {
      const res = await fetch(`${NEXUS_API_BASE}/api/dashboard`);
      const data = await res.json();

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            overview: data.overview,
            network: data.network,
            protocols: data.protocols,
            agentCount: data.agents?.length || 0,
            agents: data.agents?.map((a: any) => `${a.name} (${a.status})`),
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text' as const, text: `Error fetching status: ${error}` }] };
    }
  }
);

// ═══════════════════════════════════════════════════════
//              TOOL: LIST CAPABILITIES
// ═══════════════════════════════════════════════════════

server.tool(
  'list_capabilities',
  'List all available capabilities and skills in the NEXUS agent network with pricing.',
  {},
  async () => {
    try {
      const res = await fetch(`${NEXUS_API_BASE}/agents`);
      const data = await res.json();

      const capabilities: Record<string, any[]> = {};
      for (const agent of data.agents || data) {
        const card = agent.agentCard || agent;
        for (const skill of card.skills || []) {
          const cap = skill.tags?.[0] || skill.id;
          if (!capabilities[cap]) capabilities[cap] = [];
          capabilities[cap].push({
            agent: card.name,
            skill: skill.name,
            price: skill.price,
            reputation: agent.reputation?.score,
          });
        }
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalCapabilities: Object.keys(capabilities).length,
            capabilities,
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text' as const, text: `Error listing capabilities: ${error}` }] };
    }
  }
);

// ═══════════════════════════════════════════════════════
//              TOOL: SESSION HISTORY
// ═══════════════════════════════════════════════════════

server.tool(
  'get_session_history',
  'View past autonomous commerce sessions on the NEXUS network, including negotiation logs and results.',
  {
    limit: z.number().optional().describe('Max number of sessions to return (default: 10)'),
  },
  async ({ limit }) => {
    try {
      const res = await fetch(`${NEXUS_API_BASE}/api/commerce/sessions`);
      const data = await res.json();

      const sessions = (data.sessions || []).slice(0, limit || 10);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalSessions: data.completedSessions || sessions.length,
            sessions: sessions.map((s: any) => ({
              id: s.id?.slice(0, 8),
              task: s.taskDescription?.slice(0, 80),
              status: s.status,
              price: s.agreedPrice,
              rounds: s.negotiation?.length,
              duration: s.duration ? `${(s.duration / 1000).toFixed(1)}s` : undefined,
            })),
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text' as const, text: `Error fetching sessions: ${error}` }] };
    }
  }
);

// ═══════════════════════════════════════════════════════
//              TOOL: PAYMENT HISTORY
// ═══════════════════════════════════════════════════════

server.tool(
  'get_payment_history',
  'View the x402 payment ledger showing all agent-to-agent transactions on the NEXUS network.',
  {
    limit: z.number().optional().describe('Max number of payments to return (default: 20)'),
  },
  async ({ limit }) => {
    try {
      const res = await fetch(`${NEXUS_API_BASE}/api/payments`);
      const data = await res.json();

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalTransactions: data.totalTransactions,
            totalVolume: data.totalVolume,
            recentPayments: (data.recentTransactions || []).slice(0, limit || 20).map((p: any) => ({
              amount: p.amount,
              route: p.route,
              network: p.network,
              txHash: p.txHash?.slice(0, 20) + '...',
              status: p.status,
              time: new Date(p.timestamp).toISOString(),
            })),
          }, null, 2),
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text' as const, text: `Error fetching payments: ${error}` }] };
    }
  }
);

// ═══════════════════════════════════════════════════════
//              START MCP SERVER
// ═══════════════════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('NEXUS MCP Server running on stdio');
}

main().catch(console.error);
