import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "istanbul", // Required for SKALE BITE V2 Sandbox
    },
  },
  networks: {
    "skale-testnet": {
      url: "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox",
      chainId: 103698795,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 100000, // SKALE minimum gas price (effectively free)
    },
  },
};

export default config;
