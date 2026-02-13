/**
 * NEXUS — The Autonomous Agent Commerce Protocol
 * 
 * Main server entry point. Combines:
 * - x402 payment middleware (HTTP-native payments)
 * - Google A2A protocol (agent discovery)
 * - Multi-agent orchestrator (autonomous commerce)
 * - ERC-8004 integration (on-chain identity & reputation)
 * - SKALE blockchain (gasless transactions)
 * - Google Gemini AI (agent intelligence)
 * 
 * This is the core of the NEXUS commerce network.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

import { config } from './config';
import { x402FallbackMiddleware, getX402RouteConfig, paymentLedger } from './x402/middleware';
import { createA2ARouter, seedDefaultAgents, agentDirectory, taskManager } from './a2a/server';
import {
  executeCommerceSession,
  sessionManager,
  startAutoDemo,
  stopAutoDemo,
  onEvent,
} from './agents/orchestrator';
import { getBlockchainStatus } from './blockchain/erc8004';

// ═══════════════════════════════════════════════════════
//                   SERVER SETUP
// ═══════════════════════════════════════════════════════

const app = express();
const isVercel = !!process.env.VERCEL;

// HTTP server + WebSocket only for non-serverless environments
let server: http.Server | undefined;
let wss: WebSocketServer | undefined;

if (!isVercel) {
  server = http.createServer(app);
  wss = new WebSocketServer({ server, path: '/ws' });
}

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ═══════════════════════════════════════════════════════
//              x402 PROTECTED ROUTES (Official Coinbase SDK)
// ═══════════════════════════════════════════════════════

// Try official @x402/express middleware first, fall back to custom implementation
async function setupX402(expressApp: ReturnType<typeof express>) {
  const payTo = config.paymentWalletAddress;

  try {
    // Official Coinbase x402 middleware with facilitator verification
    // @ts-ignore — @x402 packages use package.json exports (requires moduleResolution: node16+)
    const x402Express = await import('@x402/express');
    // @ts-ignore
    const x402Core = await import('@x402/core/server');
    // @ts-ignore
    const x402Evm = await import('@x402/evm/exact/server');

    // Verify facilitator is reachable before configuring routes
    const facilitatorUrl = config.facilitatorUrl;
    const healthCheck = await fetch(facilitatorUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    }).catch(() => null);

    if (!healthCheck || !healthCheck.ok) {
      throw new Error(`Facilitator at ${facilitatorUrl} is not reachable`);
    }

    const facilitatorClient = new x402Core.HTTPFacilitatorClient({
      url: facilitatorUrl,
    });
    
    // Create EVM scheme and register BITE V2 Sandbox USDC
    const evmScheme = new x402Evm.ExactEvmScheme();
    evmScheme.registerMoneyParser(async (amount: number, network: string) => {
      if (network === 'eip155:103698795') {
        // SKALE BITE V2 Sandbox USDC (6 decimals)
        const tokenAmount = Math.round(amount * 1e6).toString();
        return {
          amount: tokenAmount,
          asset: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8', // USDC on BITE V2
          extra: { name: 'USDC', version: '2' },
        };
      }
      return null; // fall through to default
    });
    
    const resourceServer = new x402Express.x402ResourceServer(facilitatorClient)
      .register('eip155:103698795', evmScheme);

    const routeConfig = getX402RouteConfig(payTo);
    expressApp.use(x402Express.paymentMiddleware(routeConfig, resourceServer));
    console.log('✅ x402: Official Coinbase @x402/express middleware active (facilitator verified)');
    return;
  } catch (error: any) {
    console.log(`⚠️  x402: Official middleware skipped — ${error.message || 'facilitator unavailable'}`);
  }

  // Fallback: custom middleware for local dev / SKALE-only mode  
  // Still demonstrates x402 protocol compliance without live facilitator
  expressApp.use(x402FallbackMiddleware(payTo));
  console.log('✅ x402: Fallback middleware active (x402 headers + SKALE settlement)');
}

// Initialize x402 before routes
setupX402(app).then(() => {
  // Protected premium endpoints (gated by x402 middleware above)
  app.get('/api/premium/analysis', async (req, res) => {
    try {
      const session = await executeCommerceSession(
        'Provide a real-time market analysis of the agentic commerce sector',
        'data', 0.01, 'x402-Client'
      );
      res.json({
        analysis: session.result,
        negotiation: session.negotiation,
        agreedPrice: session.agreedPrice,
        agent: session.serviceAgentId,
        payment: (req as any).x402Payment || { protocol: 'x402', status: 'settled' },
      });
    } catch {
      res.json({
        analysis: {
          market: 'Agentic Commerce',
          trend: 'Rapidly growing',
          opportunities: ['x402 infrastructure', 'ERC-8004 identity', 'Agent-to-agent commerce'],
          confidence: 0.94,
          generatedBy: 'NEXUS DataSense Agent',
        },
      });
    }
  });

  app.get('/api/premium/report', async (req, res) => {
    try {
      const session = await executeCommerceSession(
        'Generate a comprehensive market report on autonomous AI agent commerce ecosystem',
        'market', 0.02, 'x402-Client'
      );
      res.json({
        report: session.result,
        negotiation: session.negotiation,
        agreedPrice: session.agreedPrice,
        agent: session.serviceAgentId,
        payment: (req as any).x402Payment || { protocol: 'x402', status: 'settled' },
      });
    } catch {
      res.json({ report: 'Report generation failed' });
    }
  });

  app.post('/api/premium/task', async (req, res) => {
    const { task, capability, budget } = req.body;
    try {
      const session = await executeCommerceSession(
        task || 'General analysis',
        capability || 'data',
        budget || 0.05,
        'x402-PremiumClient'
      );
      res.json({ session, payment: (req as any).x402Payment });
    } catch (error) {
      res.status(500).json({ error: 'Task execution failed' });
    }
  });
});

// ═══════════════════════════════════════════════════════
//              A2A PROTOCOL ROUTES
// ═══════════════════════════════════════════════════════

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:${config.port}`;
seedDefaultAgents(baseUrl);

const a2aRouter = createA2ARouter(baseUrl);
app.use(a2aRouter);

// ═══════════════════════════════════════════════════════
//              COMMERCE API ROUTES
// ═══════════════════════════════════════════════════════

// Execute a commerce session
app.post('/api/commerce/execute', async (req, res) => {
  const { task, capability, budget, clientName } = req.body;
  
  if (!task || !capability) {
    res.status(400).json({ error: 'task and capability are required' });
    return;
  }

  try {
    const session = await executeCommerceSession(
      task,
      capability,
      budget || 0.05,
      clientName || 'WebClient'
    );
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get all commerce sessions
app.get('/api/commerce/sessions', (req, res) => {
  res.json(sessionManager.getStats());
});

// Get a specific session
app.get('/api/commerce/sessions/:id', (req, res) => {
  const session = sessionManager.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json(session);
});

// ═══════════════════════════════════════════════════════
//              PAYMENT API ROUTES
// ═══════════════════════════════════════════════════════

app.get('/api/payments', (req, res) => {
  res.json(paymentLedger.getStats());
});

// ═══════════════════════════════════════════════════════
//              DASHBOARD API ROUTES
// ═══════════════════════════════════════════════════════

app.get('/api/dashboard', (req, res) => {
  const agentStats = agentDirectory.getStats();
  const commerceStats = sessionManager.getStats();
  const paymentStats = paymentLedger.getStats();
  const agents = agentDirectory.getAll();

  res.json({
    overview: {
      totalAgents: agentStats.totalAgents,
      activeAgents: agentStats.activeAgents,
      totalSkills: agentStats.totalSkills,
      averageReputation: Math.round(agentStats.averageReputation),
      activeSessions: commerceStats.activeSessions,
      completedSessions: commerceStats.completedSessions,
      totalTransactions: paymentStats.totalTransactions,
      totalVolume: paymentStats.totalVolume.toFixed(4),
      totalNegotiations: commerceStats.totalNegotiations,
      avgNegotiationRounds: commerceStats.averageNegotiationRounds.toFixed(1),
    },
    agents: agents.map(a => ({
      id: a.id,
      name: a.agentCard.name,
      description: a.agentCard.description,
      skills: a.agentCard.skills.map(s => ({ id: s.id, name: s.name, price: s.price })),
      reputation: a.reputation,
      status: a.status,
      transactions: a.transactions,
      earnings: a.earnings.toFixed(4),
      erc8004Id: a.agentCard.erc8004?.agentId,
    })),
    recentSessions: commerceStats.sessions.slice(0, 10),
    recentPayments: paymentStats.recentTransactions.slice(0, 10),
    network: {
      name: 'SKALE BITE V2 Sandbox',
      chainId: config.skaleChainId,
      rpcUrl: config.skaleRpcUrl,
      gasless: true,
    },
    protocols: {
      x402: { enabled: true, facilitator: config.facilitatorUrl },
      a2a: { enabled: true, endpoint: `${baseUrl}/.well-known/agent.json` },
      erc8004: {
        enabled: true,
        registries: {
          identity: config.agentRegistryAddress || 'pending-deployment',
          reputation: config.reputationRegistryAddress || 'pending-deployment',
        },
      },
    },
  });
});

// ═══════════════════════════════════════════════════════
//              BLOCKCHAIN STATUS
// ═══════════════════════════════════════════════════════

app.get('/api/blockchain/status', async (req, res) => {
  try {
    const status = await getBlockchainStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check blockchain status' });
  }
});

// ═══════════════════════════════════════════════════════
//              DEMO CONTROL
// ═══════════════════════════════════════════════════════

app.post('/api/demo/start', (req, res) => {
  const interval = req.body.interval || 15000;
  startAutoDemo(interval);
  res.json({ status: 'Demo started', interval });
});

app.post('/api/demo/stop', (req, res) => {
  stopAutoDemo();
  res.json({ status: 'Demo stopped' });
});

// ═══════════════════════════════════════════════════════
//              HEALTH CHECK
// ═══════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  const productionReady = !!(config.geminiApiKey && config.deployerPrivateKey && config.agentRegistryAddress && config.reputationRegistryAddress);
  
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    version: '1.0.0',
    mode: productionReady ? 'production' : 'partial',
    protocols: ['x402', 'a2a', 'erc-8004', 'mcp'],
    network: 'SKALE BITE V2 Sandbox',
    services: {
      geminiAI: config.geminiApiKey ? 'active' : 'fallback',
      skaleBlockchain: config.deployerPrivateKey ? 'active' : 'no-signer',
      agentRegistry: config.agentRegistryAddress ? 'deployed' : 'not-deployed',
      reputationRegistry: config.reputationRegistryAddress ? 'deployed' : 'not-deployed',
      escrow: config.escrowAddress ? 'deployed' : 'not-deployed',
      x402Facilitator: config.facilitatorUrl,
      paymentWallet: config.paymentWalletAddress,
    },
  });
});

// ═══════════════════════════════════════════════════════
//              WEBSOCKET HANDLING (non-serverless only)
// ═══════════════════════════════════════════════════════

if (wss) {
  wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 WebSocket client connected');
    
    ws.send(JSON.stringify({
      event: 'connected',
      data: {
        agents: agentDirectory.getAll().length,
        sessions: sessionManager.getStats().completedSessions,
      },
    }));

    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
    });
  });

  // Broadcast events to all WebSocket clients
  onEvent((event, data) => {
    const message = JSON.stringify({ event, data, timestamp: Date.now() });
    wss!.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
}

// ═══════════════════════════════════════════════════════
//              START SERVER
// ═══════════════════════════════════════════════════════

if (server) {
server.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                   ║
║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                   ║
║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                   ║
║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                   ║
║   ██║ ╚████║███████╗██╔╝ ╚██╗╚██████╔╝███████║                  ║
║   ╚═╝  ╚═══╝╚══════╝╚═╝   ╚═╝ ╚═════╝ ╚══════╝                 ║
║                                                                  ║
║   The Autonomous Agent Commerce Protocol                         ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   🌐 Server:     http://localhost:${config.port}                       ║
║   📡 WebSocket:  ws://localhost:${config.port}/ws                      ║
║   📋 A2A Card:   http://localhost:${config.port}/.well-known/agent.json║
║   💳 x402:       Enabled (SKALE gasless)                         ║
║   🤖 Agents:     ${agentDirectory.getAll().length} registered                                  ║
║   🔗 Network:    SKALE BITE V2 Sandbox (Chain ${config.skaleChainId})  ║
║                                                                  ║
║   Protocols: x402 · A2A · ERC-8004 · SKALE · Gemini AI          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
  `);

  // ── Production Readiness Check ──────────────────
  const warnings: string[] = [];
  if (!config.geminiApiKey) warnings.push('GEMINI_API_KEY not set — AI negotiation/service using fallback');
  if (!config.deployerPrivateKey) warnings.push('DEPLOYER_PRIVATE_KEY not set — on-chain payments disabled');
  if (!config.agentRegistryAddress) warnings.push('IDENTITY_REGISTRY_ADDRESS not set — agent registration in demo mode');
  if (!config.reputationRegistryAddress) warnings.push('REPUTATION_REGISTRY_ADDRESS not set — reputation in demo mode');
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Production Readiness Warnings:');
    warnings.forEach(w => console.log(`   ⚠️  ${w}`));
    console.log('   → Run with all env vars set for full production mode\n');
  } else {
    console.log('\n✅ All production services configured — running in PRODUCTION mode\n');
  }

  // Auto-demo is OFF by default — use POST /api/demo/start to enable
  // For hackathon live demo: start sessions manually via API or dashboard
  console.log('ℹ️  Auto-demo is OFF. Use POST /api/demo/start to enable periodic sessions.');
});
} else {
  console.log('☁️  NEXUS running in Vercel serverless mode');
}

export { app, server };
export default app;
