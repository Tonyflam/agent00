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
    },
  },
  networks: {
    "skale-testnet": {
      url: process.env.SKALE_RPC_URL || "https://testnet.skalenodes.com/v1/giant-half-dual-testnet",
      chainId: 974399131,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 0, // SKALE = gasless
    },
    "skale-europa": {
      url: "https://testnet.skalenodes.com/v1/juicy-low-small-testnet",
      chainId: 1444673419,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 0,
    },
  },
};

export default config;
