import { ethers } from "hardhat";

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  NEXUS — Deploying to SKALE BITE V2 Sandbox");
  console.log("═══════════════════════════════════════════\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "sFUEL\n");

  // 1. Deploy AgentIdentityRegistry
  console.log("1/3  Deploying AgentIdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("AgentIdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const identityAddr = await identityRegistry.getAddress();
  console.log("     AgentIdentityRegistry:", identityAddr);

  // 2. Deploy ReputationRegistry
  console.log("2/3  Deploying ReputationRegistry...");
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = await ReputationRegistry.deploy(identityAddr);
  await reputationRegistry.waitForDeployment();
  const reputationAddr = await reputationRegistry.getAddress();
  console.log("     ReputationRegistry:", reputationAddr);

  // 3. Deploy AgentEscrow
  console.log("3/3  Deploying AgentEscrow...");
  const AgentEscrow = await ethers.getContractFactory("AgentEscrow");
  const escrow = await AgentEscrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log("     AgentEscrow:", escrowAddr);

  // Summary
  console.log("\n═══════════════════════════════════════════");
  console.log("  Deployment Complete!");
  console.log("═══════════════════════════════════════════");
  console.log("\nAdd these to your .env:");
  console.log(`IDENTITY_REGISTRY_ADDRESS=${identityAddr}`);
  console.log(`REPUTATION_REGISTRY_ADDRESS=${reputationAddr}`);
  console.log(`ESCROW_ADDRESS=${escrowAddr}`);
  console.log("\nVerify contracts on SKALE explorer:");
  console.log(`https://base-sepolia-testnet-explorer.skalenodes.com:10032/address/${identityAddr}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
