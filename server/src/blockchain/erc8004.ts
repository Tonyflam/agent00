/**
 * NEXUS — ERC-8004 On-Chain Integration
 * 
 * Connects to SKALE BITE V2 Sandbox and interacts with the deployed
 * ERC-8004 contracts for agent identity and reputation management.
 * 
 * When contracts are deployed, this module:
 * - Registers agents on-chain (Identity Registry)
 * - Records reputation feedback (Reputation Registry)
 * - Reads agent data from the blockchain
 * 
 * When contracts are NOT deployed (demo mode), it falls back to
 * in-memory tracking and logs what would happen on-chain.
 */

import { ethers } from 'ethers';
import { config } from '../config';

// ═══════════════════════════════════════════════════════
//              PROVIDER / SIGNER SETUP
// ═══════════════════════════════════════════════════════

let provider: ethers.JsonRpcProvider | null = null;
let signer: ethers.Wallet | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(config.skaleRpcUrl);
  }
  return provider;
}

function getSigner(): ethers.Wallet | null {
  if (!signer && config.deployerPrivateKey) {
    signer = new ethers.Wallet(config.deployerPrivateKey, getProvider());
  }
  return signer;
}

// ═══════════════════════════════════════════════════════
//              MINIMAL ABI DEFINITIONS
// ═══════════════════════════════════════════════════════

const IDENTITY_REGISTRY_ABI = [
  'function register(string name, string agentURI, string[] capabilities, tuple(string metadataKey, bytes metadataValue)[] metadata) returns (uint256)',
  'function registerMinimal(string agentURI) returns (uint256)',
  'function getAgent(uint256 agentId) view returns (tuple(string name, string agentURI, address agentWallet, bool active, uint256 registeredAt, string[] capabilities))',
  'function totalAgents() view returns (uint256)',
  'function getActiveAgents() view returns (uint256[])',
  'event AgentRegistered(uint256 indexed agentId, string name, string agentURI, address indexed owner, string[] capabilities)',
];

const REPUTATION_REGISTRY_ABI = [
  'function giveFeedback(uint256 agentId, uint256 value, uint256 decimals, string[] tags, string endpoint, string feedbackURI, bytes32 feedbackHash) returns (uint256)',
  'function quickFeedback(uint256 agentId, int128 value) external',
  'function getSummary(uint256 agentId) view returns (uint256 count, uint256 totalScore, uint256 averageScore)',
  'event FeedbackGiven(uint256 indexed feedbackId, address indexed from, uint256 indexed agentId, uint256 value)',
];

// ═══════════════════════════════════════════════════════
//              CONTRACT INSTANCES
// ═══════════════════════════════════════════════════════

function getIdentityRegistry(): ethers.Contract | null {
  if (!config.agentRegistryAddress) return null;
  const signerOrProvider = getSigner() || getProvider();
  return new ethers.Contract(config.agentRegistryAddress, IDENTITY_REGISTRY_ABI, signerOrProvider);
}

function getReputationRegistry(): ethers.Contract | null {
  if (!config.reputationRegistryAddress) return null;
  const signerOrProvider = getSigner() || getProvider();
  return new ethers.Contract(config.reputationRegistryAddress, REPUTATION_REGISTRY_ABI, signerOrProvider);
}

// Nonce manager for sequential on-chain transactions
let pendingNonce: number = -1;
let nonceInitPromise: Promise<void> | null = null;

async function getNextNonce(): Promise<number> {
  const wallet = getSigner();
  if (!wallet) throw new Error('No signer');
  
  // Initialize nonce once (thread-safe via single promise)
  if (pendingNonce < 0) {
    if (!nonceInitPromise) {
      nonceInitPromise = (async () => {
        pendingNonce = await wallet.getNonce('pending');
      })();
    }
    await nonceInitPromise;
  }
  return pendingNonce++;
}

// ═══════════════════════════════════════════════════════
//              IDENTITY OPERATIONS
// ═══════════════════════════════════════════════════════

/**
 * Register an agent on-chain via ERC-8004 Identity Registry.
 * Returns the on-chain agent ID, or falls back to a demo ID.
 */
export async function registerAgentOnChain(
  name: string,
  agentURI: string,
  capabilities: string[]
): Promise<{ agentId: number; txHash: string; onChain: boolean }> {
  const registry = getIdentityRegistry();

  if (registry) {
    try {
      const nonce = await getNextNonce();
      const tx = await registry.register(name, agentURI, capabilities, [], { nonce });
      const receipt = await tx.wait();
      
      // Parse the AgentRegistered event to get the agentId
      const event = receipt.logs.find((log: any) => {
        try {
          return registry.interface.parseLog(log)?.name === 'AgentRegistered';
        } catch { return false; }
      });

      const parsed = event ? registry.interface.parseLog(event) : null;
      const agentId = parsed ? Number(parsed.args[0]) : 0;

      console.log(`🔗 Agent "${name}" registered on-chain: ID #${agentId} | tx: ${tx.hash}`);
      return { agentId, txHash: tx.hash, onChain: true };
    } catch (error) {
      console.error(`⚠️  On-chain registration failed for "${name}":`, error);
    }
  }

  // Demo fallback — generate a deterministic ID
  const demoId = Math.abs(hashCode(name)) % 1000 + 1;
  console.log(`📋 Agent "${name}" registered (demo): ID #${demoId}`);
  return { agentId: demoId, txHash: '0x' + '0'.repeat(64), onChain: false };
}

/**
 * Get total registered agents from on-chain registry
 */
export async function getTotalAgentsOnChain(): Promise<number | null> {
  const registry = getIdentityRegistry();
  if (!registry) return null;

  try {
    return Number(await registry.totalAgents());
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════
//              REPUTATION OPERATIONS
// ═══════════════════════════════════════════════════════

/**
 * Submit reputation feedback for an agent on-chain.
 */
export async function submitReputationOnChain(
  agentId: number,
  rating: number,
  tag: string
): Promise<{ feedbackId: number; txHash: string; onChain: boolean }> {
  const registry = getReputationRegistry();

  if (registry) {
    try {
      const nonce = await getNextNonce();
      const tx = await registry.quickFeedback(agentId, Math.round(rating), { nonce });
      const receipt = await tx.wait();
      
      const event = receipt.logs.find((log: any) => {
        try {
          return registry.interface.parseLog(log)?.name === 'FeedbackGiven';
        } catch { return false; }
      });

      const parsed = event ? registry.interface.parseLog(event) : null;
      const feedbackId = parsed ? Number(parsed.args[0]) : 0;

      console.log(`🔗 Reputation feedback #${feedbackId} for agent #${agentId}: ${rating}/100 | tx: ${tx.hash}`);
      return { feedbackId, txHash: tx.hash, onChain: true };
    } catch (error) {
      console.error(`⚠️  On-chain reputation failed for agent #${agentId}:`, error);
    }
  }

  // Demo fallback
  const demoId = Date.now() % 10000;
  console.log(`📋 Reputation feedback (demo) for agent #${agentId}: ${rating}/100`);
  return { feedbackId: demoId, txHash: '0x' + '0'.repeat(64), onChain: false };
}

/**
 * Get reputation summary from on-chain registry
 */
export async function getReputationOnChain(agentId: number): Promise<{
  count: number;
  totalScore: number;
  averageScore: number;
} | null> {
  const registry = getReputationRegistry();
  if (!registry) return null;

  try {
    const [count, totalScore, averageScore] = await registry.getSummary(agentId);
    return {
      count: Number(count),
      totalScore: Number(totalScore),
      averageScore: Number(averageScore),
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════
//              NETWORK STATUS
// ═══════════════════════════════════════════════════════

/**
 * Check SKALE network connectivity and contract deployment status
 */
export async function getBlockchainStatus(): Promise<{
  connected: boolean;
  chainId: number | null;
  blockNumber: number | null;
  explorerUrl: string;
  network: string;
  contracts: {
    identity: { deployed: boolean; address: string };
    reputation: { deployed: boolean; address: string };
    escrow: { deployed: boolean; address: string };
  };
}> {
  try {
    const p = getProvider();
    const network = await p.getNetwork();
    const blockNumber = await p.getBlockNumber();

    return {
      connected: true,
      chainId: Number(network.chainId),
      blockNumber,
      explorerUrl: 'https://base-sepolia-testnet-explorer.skalenodes.com:10032',
      network: 'SKALE BITE V2 Sandbox',
      contracts: {
        identity: {
          deployed: !!config.agentRegistryAddress,
          address: config.agentRegistryAddress || 'not-deployed',
        },
        reputation: {
          deployed: !!config.reputationRegistryAddress,
          address: config.reputationRegistryAddress || 'not-deployed',
        },
        escrow: {
          deployed: !!config.escrowAddress,
          address: config.escrowAddress || 'not-deployed',
        },
      },
    };
  } catch {
    return {
      connected: false,
      chainId: null,
      blockNumber: null,
      explorerUrl: 'https://base-sepolia-testnet-explorer.skalenodes.com:10032',
      network: 'SKALE BITE V2 Sandbox',
      contracts: {
        identity: { deployed: false, address: 'unavailable' },
        reputation: { deployed: false, address: 'unavailable' },
        escrow: { deployed: false, address: 'unavailable' },
      },
    };
  }
}

// ═══════════════════════════════════════════════════════
//        REAL ON-CHAIN PAYMENT RECORDING (SKALE)
// ═══════════════════════════════════════════════════════

/**
 * Record a payment on-chain by sending a real 0-value transaction on SKALE.
 * SKALE is gasless so this costs nothing — but produces a REAL txHash
 * on a REAL blockchain that anyone can verify on the explorer.
 * 
 * The payment data is encoded in the transaction's calldata.
 */
export async function recordPaymentOnChain(paymentData: {
  sessionId: string;
  amount: string;
  payer: string;
  payee: string;
  service: string;
}): Promise<{ txHash: string; onChain: boolean; blockNumber?: number }> {
  const wallet = getSigner();

  if (wallet) {
    try {
      const calldata = ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify({
        protocol: 'nexus-x402',
        version: '1.0',
        type: 'agent-payment',
        ...paymentData,
        timestamp: Date.now(),
      })));

      const nonce = await getNextNonce();
      const tx = await wallet.sendTransaction({
        to: wallet.address, // self-transfer (0 value)
        value: 0,
        data: calldata,
        nonce,
      });

      const receipt = await tx.wait();
      console.log(`🔗 Payment recorded on-chain: ${tx.hash} (block #${receipt?.blockNumber})`);
      
      return {
        txHash: tx.hash,
        onChain: true,
        blockNumber: receipt?.blockNumber,
      };
    } catch (error: any) {
      console.error(`⚠️  On-chain payment recording failed:`, error.message || error);
    }
  }

  // Fallback — only when wallet not configured (should not happen in production)
  console.warn('⚠️  No signer available — payment not recorded on-chain');
  return {
    txHash: '0x' + 'f'.repeat(64),
    onChain: false,
  };
}

// ═══════════════════════════════════════════════════════
//              UTILITY
// ═══════════════════════════════════════════════════════

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}
