const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("=".repeat(50));
  console.log("ENERGY TOKEN DEPLOYMENT");
  console.log("=".repeat(50));
  console.log("\nDeploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "DIONE");

  // Deploy contract
  const platformWallet = deployer.address; // Use deployer as platform wallet for POC
  console.log("\nDeploying EnergyToken contract...");

  const EnergyToken = await hre.ethers.getContractFactory("EnergyToken");
  const energyToken = await EnergyToken.deploy(platformWallet);

  await energyToken.waitForDeployment();

  const contractAddress = await energyToken.getAddress();
  console.log("✓ EnergyToken deployed to:", contractAddress);

  // Create a demo project
  console.log("\n" + "=".repeat(50));
  console.log("Creating demo energy projects...");
  console.log("=".repeat(50));

  // Project 1: Solar Photovoltaic
  const tx1 = await energyToken.createProject({
    name: "Austin Solar Farm",
    location: "Austin, TX",
    projectType: "Solar",
    projectSubtype: "Photovoltaic",
    installationSizeKw: 500, // 500 kW installation
    estimatedAnnualKwh: 650000, // 650,000 kWh annual production
    totalShares: 10000, // 10,000 shares
    pricePerShare: hre.ethers.parseEther("0.01"), // 0.01 DIONE per share
    projectDuration: 788400000, // 25 years in seconds
    projectWallet: deployer.address,
    documentIPFS: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", // Example IPFS hash
  });

  await tx1.wait();
  console.log("✓ Solar Photovoltaic project created (ID: 1)!");

  // Get project details (returned as tuple/array)
  const project = await energyToken.projects(1);
  const metadata = await energyToken.projectMetadata(1);

  console.log("\nProject 1 Details:");
  console.log("  Name:", project[0]); // name is first field
  console.log("  Location:", project[1]); // location is second field
  console.log("  Type:", metadata[0]); // projectType
  console.log("  Subtype:", metadata[1]); // projectSubtype
  console.log(
    "  Installation Size:",
    project[2].toString(), // installationSizeKw
    "kW"
  );
  console.log(
    "  Estimated Annual Production:",
    project[3].toString(), // estimatedAnnualKwh
    "kWh"
  );
  console.log("  Total Shares:", project[4].toString()); // totalShares
  console.log(
    "  Price per Share:",
    hre.ethers.formatEther(project[6]), // pricePerShare
    "DIONE"
  );

  // Calculate kWh per share (handle BigInt division)
  if (project[4] > 0n) {
    // totalShares
    const kwhPerShare = project[3] / project[4]; // estimatedAnnualKwh / totalShares
    console.log("  kWh per Share per Year:", kwhPerShare.toString());
  } else {
    console.log("  kWh per Share per Year: N/A");
  }

  // Get document URI
  const documentURI = await energyToken.getProjectDocumentURI(1);
  console.log("  Document URI:", documentURI);

  console.log("\n" + "=".repeat(50));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log("Contract Address:", contractAddress);
  console.log("Platform Wallet:", platformWallet);
  console.log("Demo Project ID: 1");
  console.log("Network:", hre.network.name);
  console.log("\n✓ Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Save CONTRACT_ADDRESS to .env");
  console.log("2. Fund your wallet with test DIONE");
  console.log("3. Run oracle simulator to record production");
  console.log("4. Test purchasing shares");
  console.log("=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
