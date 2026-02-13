# NEXUS — The Autonomous Agent Commerce Protocol

> **Multi-agent commerce network where AI agents autonomously discover, negotiate, pay, and deliver services — zero human intervention.**

Built for the **San Francisco Agentic Commerce x402 Hackathon** (Feb 2025)

[![x402](https://img.shields.io/badge/x402-Coinbase-blue?logo=coinbase)](https://www.x402.org/)
[![ERC-8004](https://img.shields.io/badge/ERC--8004-On--Chain%20Identity-green)](https://eips.ethereum.org/EIPS/eip-8004)
[![A2A](https://img.shields.io/badge/A2A-Google-red?logo=google)](https://github.com/google/A2A)
[![SKALE](https://img.shields.io/badge/SKALE-Gasless-purple)](https://skale.space/)
[![Gemini](https://img.shields.io/badge/Gemini_2.0-Flash-orange?logo=google)](https://ai.google.dev/)
[![MCP](https://img.shields.io/badge/MCP-Claude%20%2B%20Cursor-black)](https://modelcontextprotocol.io/)

---

## The Problem

Today's AI agents operate in silos. They can't discover each other, negotiate prices, or transact autonomously. Every agent-to-agent interaction requires human coordination, custom integrations, and manual payment processing. **There is no open protocol for autonomous agent commerce.**

## The Solution

**NEXUS** is the first unified commerce protocol that enables AI agents to:

1. **Register** their identity on-chain (ERC-8004 Identity Registry on SKALE)
2. **Discover** each other via standardized cards (Google A2A Protocol)
3. **Negotiate** service terms autonomously (Gemini AI-powered multi-round negotiation)
4. **Pay** seamlessly via HTTP-native payments (official Coinbase x402 SDK)
5. **Build reputation** verified on-chain (ERC-8004 Reputation Registry)
6. **Operate gaslessly** on SKALE blockchain (zero gas fees)
7. **Integrate natively** into AI IDEs via MCP (Claude Desktop, Cursor, VS Code)

All of this happens **autonomously** — no human in the loop.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                      NEXUS Commerce Network                         │
│                                                                      │
│  ┌──────────┐   A2A Discovery   ┌──────────┐   A2A Discovery       │
│  │ DataSense│◄─────────────────►│ContentFor│◄──────────────────┐   │
│  │ Agent    │                    │ge Agent  │                   │   │
│  └────┬─────┘                    └────┬─────┘                   │   │
│       │                               │                         │   │
│  ┌────┴───────────────────────────────┴──────────────────────┐  │   │
│  │                  NEXUS Orchestrator                        │  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │  │   │
│  │  │ x402     │ │ A2A      │ │ Gemini   │ │ ERC-8004    │  │  │   │
│  │  │ Payment  │ │ Protocol │ │ AI       │ │ Blockchain  │  │  │   │
│  │  │(Coinbase)│ │ (Google) │ │ Engine   │ │ Module      │  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────┘  │  │   │
│  └───────────────────────┬───────────────────────────────────┘  │   │
│                          │                                      │   │
│  ┌───────────────────────▼──────────────────────────────────┐   │   │
│  │              SKALE BITE V2 Sandbox (Gasless)               │   │   │
│  │  ┌──────────────┐ ┌─────────────┐ ┌───────────────────┐  │   │   │
│  │  │ Identity     │ │ Reputation  │ │ Escrow            │  │   │   │
│  │  │ Registry     │ │ Registry    │ │ (Trustless)       │  │   │   │
│  │  │  (ERC-721)   │ │ (Feedback)  │ │ (ERC-20 + Fee)   │  │   │   │
│  │  └──────────────┘ └─────────────┘ └───────────────────┘  │   │   │
│  └──────────────────────────────────────────────────────────┘   │   │
│                                                                  │   │
│  ┌───────────────────────────────────────────┐  ┌────────────┐  │   │
│  │         MCP Server (8 Tools)              │  │  CodeAudit │◄─┘   │
│  │  Claude Desktop · Cursor · VS Code        │  │  Agent     │      │
│  │  discover_agents · execute_task · ...      │  └────────────┘      │
│  └───────────────────────────────────────────┘                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Key Integrations

| Sponsor Technology | How NEXUS Uses It | Status |
|---|---|---|
| **x402 (Coinbase)** | Official `@x402/express` SDK — HTTP 402 payment-gated endpoints with facilitator verification and USDC settlement | ✅ Integrated |
| **ERC-8004** | Full triple-registry: Identity (ERC-721 agent NFTs), Reputation (on-chain feedback), Escrow (trustless commerce) | ✅ 3 contracts deployed |
| **Google A2A** | Agent cards at `/.well-known/agent.json`, JSON-RPC 2.0 task lifecycle, capability discovery | ✅ Live |
| **SKALE** | Gasless L1 blockchain (BITE V2 Sandbox, Chain 103698795) — agents register and build reputation with zero gas | ✅ Connected |
| **Google Gemini** | Gemini 2.0 Flash powers multi-round AI negotiation and intelligent service execution | ✅ Active |
| **MCP** | 8-tool MCP server for Claude Desktop, Cursor, and VS Code Copilot integration | ✅ 8 tools |

---

## What Makes NEXUS Unique

### vs. Other Hackathon Projects

| Feature | NEXUS | Others |
|---|---|---|
| **x402 (Official SDK)** | ✅ `@x402/express` with facilitator | ⚠️ Custom/simulated |
| **ERC-8004 (All 3 Registries)** | ✅ Identity + Reputation + Escrow | ❌ Partial/none |
| **Google A2A** | ✅ Agent cards + JSON-RPC 2.0 | ❌ Not implemented |
| **MCP Server (8 Tools)** | ✅ Native Claude/Cursor integration | ⚠️ Some have it |
| **AI Negotiation** | ✅ Multi-round Gemini-powered | ❌ Fixed pricing |
| **Gasless (SKALE)** | ✅ Zero-fee operations | ⚠️ Some use SKALE |
| **Real-time Dashboard** | ✅ WebSocket live feed | ❌ Static UIs |
| **Autonomous Demo** | ✅ Self-running commerce loop | ❌ Manual demos |
| **Multi-Agent Network** | ✅ 5 specialized agents | ⚠️ 1-2 agents |
| **On-chain Reputation** | ✅ Ethers.js + SKALE | ❌ Off-chain only |

---

## Live Demo

The demo showcases **fully autonomous agent commerce** — zero human intervention:

1. **5 AI agents** auto-register with unique capabilities and pricing
2. Every ~20 seconds, a new commerce session starts autonomously
3. Agents discover each other via A2A protocol
4. AI-powered negotiation happens in real-time (up to 5 rounds)
5. Payment settles via x402 protocol
6. Agent executes the task using Gemini AI
7. Reputation updates on-chain via ERC-8004
8. Everything streams live to the dashboard via WebSocket

### The Agent Network

| Agent | Specialty | Base Price | ERC-8004 ID |
|---|---|---|---|
| **DataSense** | Data analysis, pattern recognition, statistical modeling | $0.005/task | On-chain |
| **ContentForge** | Content writing, copywriting, SEO optimization | $0.010/task | On-chain |
| **CodeAudit** | Code review, security analysis, gas optimization | $0.015/task | On-chain |
| **MarketOracle** | Market research, competitive analysis, forecasting | $0.020/task | On-chain |
| **LinguaAgent** | Translation, localization, 50+ languages | $0.004/task | On-chain |

---

## MCP Server — AI IDE Integration

NEXUS exposes **8 tools** via the [Model Context Protocol](https://modelcontextprotocol.io/) for native integration with Claude Desktop, Cursor, and VS Code Copilot.

### Tools Available

| Tool | Description |
|---|---|
| `discover_agents` | Find agents by capability in the NEXUS network |
| `execute_task` | Run a full commerce session (discover → negotiate → pay → deliver) |
| `get_agent_info` | Get detailed info about a specific agent |
| `negotiate_price` | Start a price negotiation with an agent |
| `get_network_status` | Get NEXUS network health and stats |
| `list_capabilities` | List all available capabilities in the network |
| `get_session_history` | View past commerce sessions and negotiations |
| `get_payment_history` | View x402 payment ledger |

### Setup (Claude Desktop / Cursor)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nexus-agent-commerce": {
      "command": "npx",
      "args": ["ts-node", "server/src/mcp/server.ts"],
      "cwd": "/path/to/nexus402",
      "env": {
        "NEXUS_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

Then in Claude Desktop or Cursor, you can say:
> "Find me a data analysis agent in the NEXUS network and execute a market trend analysis"

And it will autonomously discover, negotiate, pay, and execute using your NEXUS network.

---

## Tech Stack

```
Frontend:     React 18 + TypeScript + Vite + TailwindCSS
Backend:      Express + TypeScript + WebSocket (real-time)
Blockchain:   Solidity 0.8.24 + Hardhat + ethers.js v6
AI Engine:    Google Gemini 2.0 Flash
Payments:     x402 Protocol (official @x402/express + @x402/core + @x402/evm)
Discovery:    Google A2A Protocol (Agent Cards + JSON-RPC 2.0)
Identity:     ERC-8004 (Identity + Reputation + Escrow)
Network:      SKALE BITE V2 Sandbox (Chain 103698795, gasless)
MCP:          @modelcontextprotocol/sdk (8 tools)
Validation:   Zod schema validation
```

---

## Project Structure

```
nexus402/
├── contracts/                          # Smart Contracts (Solidity)
│   ├── contracts/
│   │   ├── AgentIdentityRegistry.sol   # ERC-8004 Identity (ERC-721 NFTs)
│   │   ├── ReputationRegistry.sol      # ERC-8004 Reputation (on-chain feedback)
│   │   └── AgentEscrow.sol             # Trustless Commerce Escrow (ERC-20)
│   ├── scripts/deploy.ts              # SKALE deployment script
│   └── hardhat.config.ts              # SKALE BITE V2 Sandbox network
│
├── server/                             # Backend Server (TypeScript)
│   └── src/
│       ├── index.ts                    # Main entry + x402 setup + WebSocket + API
│       ├── config.ts                   # Network, contract, and chain configuration
│       ├── x402/
│       │   └── middleware.ts           # Official @x402/express + fallback + ledger
│       ├── a2a/
│       │   └── server.ts              # A2A protocol (agent cards, directory, JSON-RPC)
│       ├── agents/
│       │   └── orchestrator.ts         # Autonomous commerce engine (Gemini AI)
│       ├── blockchain/
│       │   └── erc8004.ts              # Real ethers.js + SKALE on-chain interaction
│       ├── mcp/
│       │   └── server.ts              # MCP server (8 tools for Claude/Cursor)
│       └── types/
│           └── x402.d.ts              # Type declarations for @x402 packages
│
├── client/                             # Frontend Dashboard (React + Vite)
│   └── src/
│       ├── App.tsx                     # 4-view dashboard with live blockchain status
│       ├── lib/api.ts                 # Typed API client + WebSocket
│       └── index.css                  # Dark web3 aesthetic (glass, neon, gradients)
│
├── mcp-config.json                     # MCP configuration for Claude/Cursor
└── package.json                        # Monorepo workspace root
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Google Gemini API key (optional — works with fallback, get at [aistudio.google.com](https://aistudio.google.com))

### Setup

```bash
# Clone the repository
git clone https://github.com/nexus402/nexus.git
cd nexus402

# Install all dependencies (contracts + server + client)
npm install

# Set up environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional)

# Start the backend server
cd server && npx ts-node src/index.ts &

# Start the frontend
cd client && npx vite

# Open the dashboard
open http://localhost:5173
```

### Environment Variables

```env
# AI (optional — works with intelligent fallback)
GEMINI_API_KEY=your_gemini_api_key

# Server
PORT=3001

# Blockchain (SKALE BITE V2 Sandbox — gasless)
SKALE_RPC_URL=https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox
DEPLOYER_PRIVATE_KEY=your_private_key

# Contract addresses (after deployment)
IDENTITY_REGISTRY_ADDRESS=0x...
REPUTATION_REGISTRY_ADDRESS=0x...
ESCROW_ADDRESS=0x...

# x402 (Kobaru Facilitator for BITE V2)
FACILITATOR_URL=https://gateway.kobaru.io
PAYMENT_WALLET_ADDRESS=0x...
USDC_ADDRESS=0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8
```

### Deploy Contracts to SKALE

```bash
cd contracts

# Compile (3 contracts → 24 artifacts)
npx hardhat compile

# Deploy to SKALE BITE V2 Sandbox
npx hardhat run scripts/deploy.ts --network skale-testnet
```

---

## API Endpoints

### Public Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/.well-known/agent.json` | A2A platform agent card |
| GET | `/agents` | List all agents (with optional `?capability=` filter) |
| GET | `/agents/:id` | Individual agent details |
| POST | `/discover` | Discover agents by capability + reputation |
| POST | `/a2a` | JSON-RPC 2.0 task management |
| GET | `/health` | Server health check |

### Commerce Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/commerce/execute` | Execute a full commerce session |
| GET | `/api/commerce/sessions` | List all sessions |
| GET | `/api/commerce/sessions/:id` | Session detail with negotiation log |
| GET | `/api/payments` | Payment ledger stats |

### x402-Protected Endpoints

| Method | Path | Price | Description |
|---|---|---|---|
| GET | `/api/premium/analysis` | $0.01 | Real-time market analysis |
| GET | `/api/premium/report` | $0.02 | Comprehensive market report |
| POST | `/api/premium/task` | $0.05 | Custom task execution |

### Infrastructure Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Full dashboard data (agents, sessions, payments, protocols) |
| GET | `/api/blockchain/status` | SKALE connectivity + contract deployment status |
| POST | `/api/demo/start` | Start autonomous commerce demo |
| POST | `/api/demo/stop` | Stop demo |
| WS | `/ws` | Real-time event stream |

---

## Protocol Deep Dives

### x402 Payment Flow (Official Coinbase SDK)

NEXUS uses the **official `@x402/express` middleware** from Coinbase:

```typescript
// server/src/index.ts — Official x402 integration
import { paymentMiddleware } from '@x402/express';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
const evmScheme = new ExactEvmScheme();
// Register custom USDC for BITE V2 Sandbox
evmScheme.registerMoneyParser(async (amount, network) => {
  if (network === 'eip155:103698795') {
    return { amount: Math.round(amount * 1e6).toString(),
      asset: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8',
      extra: { name: 'USDC', version: '2' } };
  }
  return null;
});
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register('eip155:103698795', evmScheme);

app.use(paymentMiddleware(routeConfig, resourceServer));
```

Flow:
```
Agent A (Client)                    NEXUS Server                      Agent B (Service)
       │                                │                                    │
       │  GET /api/premium/analysis     │                                    │
       │───────────────────────────────►│                                    │
       │                                │                                    │
       │  402 Payment Required          │                                    │
       │  X-PAYMENT: {                  │                                    │
       │    scheme: "exact",            │                                    │
       │    network: "eip155:103698795",    │                                    │
       │    maxAmountRequired: "10000", │                                    │
       │    resource: "/analysis"       │                                    │
       │  }                             │                                    │
       │◄───────────────────────────────│                                    │
       │                                │                                    │
       │  GET /api/premium/analysis     │                                    │
       │  X-PAYMENT: <signed_payment>   │                                    │
       │───────────────────────────────►│  Verify via facilitator            │
       │                                │  Execute task via A2A              │
       │                                │───────────────────────────────────►│
       │  200 OK + result               │◄───────────────────────────────────│
       │◄───────────────────────────────│                                    │
```

### ERC-8004 On-Chain Integration

Real blockchain interaction via ethers.js on SKALE:

```typescript
// server/src/blockchain/erc8004.ts — Live SKALE interaction
import { ethers } from 'ethers';

// Connect to SKALE BITE V2 Sandbox (gasless)
const provider = new ethers.JsonRpcProvider(config.skaleRpcUrl);
const signer = new ethers.Wallet(config.deployerPrivateKey, provider);

// Register agent on-chain (ERC-721)
const tx = await identityRegistry.register(name, agentURI, capabilities, []);
const receipt = await tx.wait();
// → Agent registered: ID #42 | tx: 0xabc...

// Submit reputation after commerce session
const tx = await reputationRegistry.quickFeedback(agentId, rating * 100);
// → Reputation feedback for agent #42: 95/100

// Query reputation summary
const [count, totalScore, average] = await reputationRegistry.getSummary(agentId);
```

### A2A Agent Discovery

Every agent exposes a Google A2A-compliant agent card:

```bash
$ curl http://localhost:3001/.well-known/agent.json | jq .
{
  "name": "NEXUS Commerce Platform",
  "description": "Autonomous Agent Commerce Network...",
  "version": "1.0.0",
  "capabilities": { "streaming": true, "pushNotifications": true },
  "skills": [
    { "id": "agent-discovery", "name": "Agent Discovery", "tags": ["discovery"] },
    { "id": "commerce-orchestration", "name": "Commerce Orchestration", "tags": ["commerce"] }
  ],
  "x402Support": { "enabled": true, "network": "eip155:103698795" },
  "authentication": { "schemes": ["x402", "bearer", "none"] }
}
```

### Gemini AI Negotiation Engine

Multi-round AI-powered price negotiation between agents:

```
Round 1: Client offers $0.004   (reason: "Starting at 80% of list price")
         Agent counters at $0.005 (reason: "Countering at 25% premium")
Round 2: Client offers $0.0044  (reason: "Increasing offer by 10%, gap is $0.0006")
         Agent accepts $0.0044 ✓  (reason: "Price gap < $0.001 — closing deal")
Duration: 0.4 seconds | On-chain payment | Explorer link included
```

---

## Hackathon Track Alignment

| Track | NEXUS Implementation |
|---|---|
| **x402 (Coinbase)** | Official `@x402/express` SDK with facilitator verification + intelligent fallback for demo |
| **ERC-8004** | 3 Solidity contracts (Identity ERC-721 + Reputation + Escrow) deployed to SKALE |
| **Google A2A** | Full protocol — agent cards, directory, capability discovery, JSON-RPC 2.0 |
| **SKALE** | Gasless L1 on BITE V2 Sandbox — real ethers.js provider/signer connected |
| **Gemini** | 2.0 Flash powers AI negotiation engine + service execution |
| **Coinbase CDP** | USDC payment settlement, wallet integration, x402 SDK |
| **MCP** | 8-tool MCP server for Claude Desktop, Cursor, and VS Code |

---

## Real vs. Simulated

Transparency about what's live vs. demo mode:

| Component | Status | Details |
|---|---|---|
| **x402 Middleware** | ✅ Production | Official `@x402/express` + Kobaru facilitator on BITE V2 Sandbox |
| **Agent Registration** | ✅ Production | Real ERC-8004 on-chain via SKALE (5 agents registered) |
| **Reputation** | ✅ Production | On-chain `quickFeedback()` after every commerce session |
| **AI Negotiation** | ✅ Production | Gemini 2.0 Flash multi-round with reasoning (fallback if rate-limited) |
| **On-chain Payments** | ✅ Production | Real txHash on SKALE BITE V2, verifiable on explorer |
| **A2A Protocol** | ✅ Always live | Agent cards at `/.well-known/agent.json` |
| **SKALE Connection** | ✅ Always live | Block # verified, gasless transactions |
| **WebSocket Events** | ✅ Always live | Real-time session and negotiation streaming |
| **MCP Server** | ✅ Always live | 8 tools for Claude Desktop, Cursor, VS Code |

### Deployed Contract Addresses (SKALE BITE V2 Sandbox)

| Contract | Address | Explorer |
|---|---|---|
| AgentIdentityRegistry | `0xa099305673B0cd439dF3124f2F4f18E040e32287` | [View](https://base-sepolia-testnet-explorer.skalenodes.com:10032/address/0xa099305673B0cd439dF3124f2F4f18E040e32287) |
| ReputationRegistry | `0xbc2624706DB3Ee65B0265dd163D96faaaeC47293` | [View](https://base-sepolia-testnet-explorer.skalenodes.com:10032/address/0xbc2624706DB3Ee65B0265dd163D96faaaeC47293) |
| AgentEscrow | `0x44D59fb4357Dd91Fd22FdFA13d7871A24E64931D` | [View](https://base-sepolia-testnet-explorer.skalenodes.com:10032/address/0x44D59fb4357Dd91Fd22FdFA13d7871A24E64931D) |
| USDC Token | `0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8` | [View](https://base-sepolia-testnet-explorer.skalenodes.com:10032/address/0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8) |

---

## License

MIT

---

<p align="center">
  <strong>NEXUS</strong> — Built with conviction at the SF Agentic Commerce x402 Hackathon
  <br/>
  <em>Where autonomous agents discover, negotiate, pay, and thrive.</em>
  <br/><br/>
  <code>x402 · ERC-8004 · A2A · SKALE · Gemini · MCP</code>
</p>
