import dotenv from 'dotenv';

// In Vercel, env vars are injected directly — dotenv only needed for local dev
if (!process.env.VERCEL) {
  dotenv.config({ path: '../.env' });
}

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // AI
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  
  // SKALE BITE V2 Sandbox (Hackathon Chain)
  skaleRpcUrl: process.env.SKALE_RPC_URL || 'https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox',
  skaleChainId: parseInt(process.env.SKALE_CHAIN_ID || '103698795'),
  skaleExplorerUrl: 'https://base-sepolia-testnet-explorer.skalenodes.com:10032',
  usdcAddress: process.env.USDC_ADDRESS || '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8',
  deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
  
  // Contracts (ERC-8004)
  agentRegistryAddress: process.env.IDENTITY_REGISTRY_ADDRESS || process.env.AGENT_REGISTRY_ADDRESS || '',
  reputationRegistryAddress: process.env.REPUTATION_REGISTRY_ADDRESS || '',
  escrowAddress: process.env.ESCROW_ADDRESS || '',
  
  // x402 (Kobaru Facilitator on BITE V2)
  facilitatorUrl: process.env.FACILITATOR_URL || 'https://gateway.kobaru.io',
  paymentWalletAddress: process.env.PAYMENT_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
  
  // Server
  corsOrigins: ['http://localhost:5173', 'http://localhost:3000', '*'],
};
