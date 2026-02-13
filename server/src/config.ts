import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // AI
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  
  // SKALE
  skaleRpcUrl: process.env.SKALE_RPC_URL || 'https://testnet.skalenodes.com/v1/giant-half-dual-testnet',
  skaleChainId: parseInt(process.env.SKALE_CHAIN_ID || '974399131'),
  deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
  
  // Contracts (ERC-8004)
  agentRegistryAddress: process.env.IDENTITY_REGISTRY_ADDRESS || process.env.AGENT_REGISTRY_ADDRESS || '',
  reputationRegistryAddress: process.env.REPUTATION_REGISTRY_ADDRESS || '',
  escrowAddress: process.env.ESCROW_ADDRESS || '',
  
  // x402
  facilitatorUrl: process.env.FACILITATOR_URL || 'https://facilitator.x402.org',
  paymentWalletAddress: process.env.PAYMENT_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
  
  // Server
  corsOrigins: ['http://localhost:5173', 'http://localhost:3000', '*'],
};
