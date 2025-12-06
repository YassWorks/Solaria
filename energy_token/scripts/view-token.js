const hre = require("hardhat");

async function main() {
  // Get contract address from command line argument or environment variable
  const contractAddress = process.argv[2] || process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ Error: No contract address provided!");
    console.error("\nUsage:");
    console.error("  npx hardhat run scripts/view-token.js --network dioneTestnet <CONTRACT_ADDRESS>");
    console.error("  OR set CONTRACT_ADDRESS in .env file");
    process.exit(1);
  }
  
  console.log("=".repeat(50));
  console.log("ENERGY TOKEN VIEWER");
  console.log("=".repeat(50));
  console.log("\nContract Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("RPC URL:", hre.network.config.url);
  
  const energyToken = await hre.ethers.getContractAt("EnergyToken", contractAddress);
  
  // Get contract info
  console.log("\n" + "=".repeat(50));
  console.log("CONTRACT INFO");
  console.log("=".repeat(50));
  
  const platformWallet = await energyToken.platformWallet();
  const nextProjectId = await energyToken.nextProjectId();
  const platformFee = await energyToken.platformFeePercent();
  
  console.log("Platform Wallet:", platformWallet);
  console.log("Next Project ID:", nextProjectId.toString());
  console.log("Platform Fee:", (Number(platformFee) / 100).toFixed(2) + "%");
  
  // Get project 1 details
  console.log("\n" + "=".repeat(50));
  console.log("PROJECT 1 DETAILS");
  console.log("=".repeat(50));
  
  const project = await energyToken.projects(1);
  const metadata = await energyToken.projectMetadata(1);
  
  console.log("Name:", project[0]);
  console.log("Location:", project[1]);
  console.log("Type:", metadata[0]);
  console.log("Subtype:", metadata[1]);
  console.log("Installation Size:", project[2].toString(), "kW");
  console.log("Estimated Annual Production:", project[3].toString(), "kWh");
  console.log("Total Shares:", project[4].toString());
  console.log("Shares Sold:", project[5].toString());
  console.log("Price per Share:", hre.ethers.formatEther(project[6]), "DIONE");
  console.log("Status:", ["Pending", "Active", "Completed", "Suspended"][project[8]]);
  console.log("Project Wallet:", project[9]);
  console.log("Transfers Enabled:", project[10]);
  console.log("Document IPFS:", metadata[2]);
  console.log("Document URI:", await energyToken.getProjectDocumentURI(1));
  
  // Get your account info
  console.log("\n" + "=".repeat(50));
  console.log("YOUR ACCOUNT");
  console.log("=".repeat(50));
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Your Address:", signer.address);
  
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log("Your DIONE Balance:", hre.ethers.formatEther(balance), "DIONE");
  
  const tokenBalance = await energyToken.balanceOf(signer.address, 1);
  console.log("Your Project 1 Shares:", tokenBalance.toString());
  
  if (tokenBalance > 0n) {
    const position = await energyToken.getInvestorPosition(1, signer.address);
    console.log("\nYour Investment:");
    console.log("  Shares:", position[0].toString());
    console.log("  Total Invested:", hre.ethers.formatEther(position[1]), "DIONE");
    console.log("  Lifetime kWh Earned:", position[2].toString());
    console.log("  Claimable kWh:", position[3].toString());
    console.log("  Estimated Annual kWh:", position[4].toString());
  }
  
  // Get production stats
  console.log("\n" + "=".repeat(50));
  console.log("PRODUCTION STATS");
  console.log("=".repeat(50));
  
  const stats = await energyToken.getProjectStats(1);
  console.log("Total Production:", stats[0].toString(), "kWh");
  console.log("Record Count:", stats[1].toString());
  console.log("Average Daily:", stats[2].toString(), "kWh");
  
  if (stats[3] > 0n) {
    const lastRecorded = new Date(Number(stats[3]) * 1000);
    console.log("Last Recorded:", lastRecorded.toLocaleString());
  } else {
    console.log("Last Recorded: Never");
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("✓ Token viewing complete!");
  console.log("=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error viewing token:");
    console.error(error);
    process.exit(1);
  });
