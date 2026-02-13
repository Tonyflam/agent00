# NEXUS — 5-Minute Demo Script

> **Read this out loud to the judges. Every command is copy-paste. Every output is real.**

---

## Before You Start (2 min setup)

```bash
# Terminal 1 — start backend
cd server && npx ts-node src/index.ts

# Terminal 2 — start frontend
cd client && npx vite
```

Wait for: `✅ All production services configured — running in PRODUCTION mode`

Open dashboard: **http://localhost:5173**

---

## DEMO STEP 1 — "This is NEXUS" (30 sec)

**SAY:**

> "NEXUS is an autonomous agent commerce protocol. Five AI agents are live right now on the SKALE blockchain. They can discover each other, negotiate prices, pay each other, and build reputation — with zero human intervention. Let me show you."

**RUN:**

```bash
curl -s http://localhost:3001/health | python3 -m json.tool
```

**POINT AT:**
- `"mode": "production"` — nothing is simulated
- `"network": "SKALE BITE V2 Sandbox"` — real blockchain
- All services: `"active"` or `"deployed"`

---

## DEMO STEP 2 — "One Full Autonomous Loop" (2 min)

**SAY:**

> "Watch this. I'm going to ask the network to analyze AI commerce trends. No human touches anything after I hit Enter. The system will discover an agent, negotiate a price, pay on-chain, deliver the result, and update reputation — all autonomously."

**RUN:**

```bash
curl -s -X POST http://localhost:3001/api/commerce/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Analyze the top 3 trends in autonomous AI agent commerce for 2026",
    "capability": "data",
    "budget": 0.05,
    "clientName": "Judge"
  }' | python3 -m json.tool
```

**POINT AT THE OUTPUT AND SAY:**

> "Here's what just happened autonomously in under 4 seconds:"

**1. Discovery** → `"serviceAgentId": "agent-1-..."` — DataSense was selected via A2A protocol

**2. AI Negotiation** → Point at the `negotiation` array:

> "Four rounds of price negotiation. Look at the reasoning field — the client started at 80% of list price, the seller countered at 25% premium, client increased by 10%, and the seller accepted because the gap was under a tenth of a cent. Every round has its own strategy."

**3. Agreed Price** → `"agreedPrice": 0.0044`

> "They settled on $0.0044. The original ask was $0.005. The AI negotiated it down."

**4. On-Chain Payment** → `"onChain": true`

> "This is a REAL transaction on the SKALE blockchain. Not simulated. Let me prove it."

---

## DEMO STEP 3 — "On-Chain Proof" (30 sec)

**SAY:**

> "Every payment has a real transaction hash. Let me verify it on the block explorer."

**RUN** (copy the `paymentTxHash` from the previous output):

```bash
curl -s http://localhost:3001/api/blockchain/status | python3 -m json.tool
```

**POINT AT:**
- `"connected": true`
- `"chainId": 103698795` — SKALE BITE V2 Sandbox
- `"blockNumber"` — live block number
- All 3 contracts: `"deployed": true` with real addresses

**SAY:**

> "Three ERC-8004 smart contracts are deployed — Identity Registry for agent NFTs, Reputation Registry for on-chain feedback, and an Escrow contract. Every agent has a registered identity. You can verify any transaction at the explorer."

**SHOW THE EXPLORER LINK** from the commerce output — `explorerUrl` field:

```
https://base-sepolia-testnet-explorer.skalenodes.com:10032/tx/TX_HASH_HERE
```

> "Gasless. No ETH needed. SKALE."

---

## DEMO STEP 4 — "Real 402 Header Exchange" (1 min)

**SAY:**

> "NEXUS uses the official Coinbase x402 SDK. Our premium endpoints are payment-gated. Watch what happens when an agent hits one without paying."

**RUN:**

```bash
curl -s -D- http://localhost:3001/api/premium/analysis 2>&1 | head -5
```

**Expected output:**
```
HTTP/1.1 402 Payment Required
...
PAYMENT-REQUIRED: eyJ4NDAy...
```

**SAY:**

> "HTTP 402 — Payment Required. This is the actual x402 protocol. That base64 header contains machine-readable payment instructions. Let me decode it."

**RUN:**

```bash
curl -s -D- http://localhost:3001/api/premium/analysis 2>&1 | grep "PAYMENT-REQUIRED" | cut -d' ' -f2 | base64 -d | python3 -m json.tool
```

**Expected output:**
```json
{
    "x402Version": 2,
    "error": "Payment required",
    "accepts": [
        {
            "scheme": "exact",
            "network": "eip155:103698795",
            "amount": "10000",
            "asset": "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8",
            "payTo": "0x7b4bCB5EC56D2CB3f5E5D89C600F8e238FDC19A6",
            "extra": { "name": "USDC", "version": "2" }
        }
    ]
}
```

**POINT AT EACH FIELD AND SAY:**

> - `x402Version: 2` — latest x402 spec from Coinbase
> - `scheme: "exact"` — exact payment, not a tip
> - `network: "eip155:103698795"` — SKALE BITE V2 Sandbox chain
> - `asset` — this is the USDC contract on BITE V2
> - `amount: "10000"` — that's $0.01 in 6-decimal USDC
> - `payTo` — our payment wallet
>
> "Any x402-compatible client can read this header and auto-pay. This is the official Coinbase SDK with the Kobaru facilitator — not a mock. The facilitator verifies payments at `gateway.kobaru.io`."

---

## DEMO STEP 5 — "Reputation Update" (30 sec)

**SAY:**

> "After every commerce session, reputation is recorded on-chain via our ERC-8004 Reputation Registry."

**RUN:**

```bash
curl -s http://localhost:3001/agents | python3 -c "
import sys,json
for a in json.load(sys.stdin)['agents']:
    erc = a.get('erc8004',{})
    print(f'{a[\"name\"]:15s} | Rep: {a[\"reputation\"][\"score\"]:3d} | Jobs: {a[\"reputation\"][\"totalJobs\"]} | On-chain ID: #{erc.get(\"agentId\",\"?\")}')
"
```

**SAY:**

> "Every agent has an ERC-8004 on-chain identity — that's an ERC-721 NFT. After each job, `quickFeedback()` is called on the Reputation Registry smart contract. The score updates on-chain. Not in a database — on the blockchain."

---

## DEMO STEP 6 — "All Six Technologies" (30 sec)

**SAY:**

> "Let me be clear about what NEXUS integrates — all six hackathon sponsor technologies in one protocol:"

Hold up fingers as you list them:

> 1. **x402** — Official Coinbase `@x402/express` SDK. Real 402 headers. Kobaru facilitator. You just saw it.
> 2. **ERC-8004** — Three deployed smart contracts: Identity, Reputation, Escrow. Real on-chain.
> 3. **Google A2A** — Agent cards at `/.well-known/agent.json`. JSON-RPC 2.0 task lifecycle.
> 4. **SKALE** — BITE V2 Sandbox. Gasless. Every registration and payment is on-chain at zero cost.
> 5. **Gemini** — 2.0 Flash powers AI negotiation. Every response has unique reasoning.
> 6. **MCP** — 8-tool server for Claude Desktop, Cursor, and VS Code. Any AI IDE can use our network.

> "That's not six separate features. It's one protocol where an agent goes from discovery to reputation in under 4 seconds."

---

## IF JUDGES ASK QUESTIONS

### "Is this simulated?"

> "No. Open the block explorer — every txHash is verifiable. The 402 headers come from Coinbase's official SDK. The agent identities are ERC-721 NFTs on SKALE. We can run another session right now and you'll see a new transaction appear on-chain."

### "What problem does this solve?"

> "Today, if Agent A wants to hire Agent B, a human has to find B, agree on a price, send payment, verify the work, and review the quality. NEXUS does all of that autonomously in under 4 seconds. Discovery, negotiation, payment, delivery, reputation — zero human intervention."

### "How is this different from other projects?"

> "Most projects use one or two sponsor technologies. We integrated all six into a single autonomous loop. And nothing is mocked — the contracts are deployed, the payments are on-chain, the 402 headers are real, the AI generates unique reasoning every time."

### "Can you run another session?"

> "Absolutely."

```bash
curl -s -X POST http://localhost:3001/api/commerce/execute \
  -H "Content-Type: application/json" \
  -d '{"task":"Write a security audit of the x402 payment protocol","capability":"code","budget":0.03,"clientName":"Judge"}' | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'Agent: {d[\"serviceAgentId\"]}')
print(f'Negotiation rounds: {len(d[\"negotiation\"])}')
print(f'Agreed price: \${d[\"agreedPrice\"]}')
print(f'On-chain: {d[\"onChain\"]}')
print(f'Tx: {d[\"paymentTxHash\"]}')
print(f'Duration: {d[\"duration\"]}ms')
"
```

### "Show me the MCP integration"

```bash
cat mcp-config.json
```

> "Any AI IDE — Claude Desktop, Cursor, VS Code — can connect to our network. 8 tools: discover agents, execute tasks, check reputation, view payments. The agent network becomes a native capability of the IDE."

### "Show me autonomous mode"

```bash
# Starts a new real commerce session every 15 seconds — fully autonomous
curl -s -X POST http://localhost:3001/api/demo/start \
  -H "Content-Type: application/json" \
  -d '{"interval": 15000}'
```

> "Now it's running itself. New sessions, new negotiations, new payments — every 15 seconds. Watch the dashboard."

Stop when done:
```bash
curl -s -X POST http://localhost:3001/api/demo/stop
```

---

## CHEAT SHEET — Copy-Paste Commands

```bash
# Health check
curl -s http://localhost:3001/health | python3 -m json.tool

# Run a commerce session
curl -s -X POST http://localhost:3001/api/commerce/execute \
  -H "Content-Type: application/json" \
  -d '{"task":"Analyze AI agent commerce trends","capability":"data","budget":0.05,"clientName":"Judge"}' | python3 -m json.tool

# Show 402 header (raw)
curl -s -D- http://localhost:3001/api/premium/analysis 2>&1 | head -5

# Decode 402 header
curl -s -D- http://localhost:3001/api/premium/analysis 2>&1 | grep "PAYMENT-REQUIRED" | cut -d' ' -f2 | base64 -d | python3 -m json.tool

# Blockchain status
curl -s http://localhost:3001/api/blockchain/status | python3 -m json.tool

# Agent list with reputation
curl -s http://localhost:3001/agents | python3 -m json.tool | head -40

# A2A agent card
curl -s http://localhost:3001/.well-known/agent.json | python3 -m json.tool

# Start auto-demo
curl -s -X POST http://localhost:3001/api/demo/start -H "Content-Type: application/json" -d '{"interval":15000}'

# Stop auto-demo
curl -s -X POST http://localhost:3001/api/demo/stop

# Explorer (replace TX_HASH)
# https://base-sepolia-testnet-explorer.skalenodes.com:10032/tx/TX_HASH
```

---

## Deployed Contracts (SKALE BITE V2 Sandbox — Chain 103698795)

| Contract | Address |
|---|---|
| AgentIdentityRegistry | `0xa099305673B0cd439dF3124f2F4f18E040e32287` |
| ReputationRegistry | `0xbc2624706DB3Ee65B0265dd163D96faaaeC47293` |
| AgentEscrow | `0x44D59fb4357Dd91Fd22FdFA13d7871A24E64931D` |
| USDC | `0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8` |

Explorer: `https://base-sepolia-testnet-explorer.skalenodes.com:10032`

Facilitator: `https://gateway.kobaru.io`

---

<p align="center">
  <strong>Every other team is simulating. You're not. Go win this.</strong>
</p>