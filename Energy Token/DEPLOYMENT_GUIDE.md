# 🚀 Deployment Guide - Dione Testnet

## Prerequisites

Before deploying to the real blockchain, you need:

### 1. Get Testnet DIONE Tokens

- Join Dione Discord: https://discord.gg/dioneprotocol
- Request testnet tokens in the #faucet channel
- Your wallet address: Check your `.env` file for `PRIVATE_KEY` address

### 2. Verify Your Configuration

Check `hardhat.config.js`:

```javascript
dione_testnet: {
  url: "https://testnet-rpc.dioneprotocol.com",
  chainId: 131313,
  accounts: [process.env.PRIVATE_KEY]
}
```

Check `.env`:

```
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=will_be_filled_after_deployment
```

## 🎯 Deployment Steps

### Step 1: Compile Contract

```powershell
npx hardhat compile
```

Expected output: `Compiled 1 Solidity file successfully`

### Step 2: Deploy to Dione Testnet

```powershell
npx hardhat run scripts/deploy.js --network dione_testnet
```

Expected output:

```
==================================================
ENERGY TOKEN DEPLOYMENT
==================================================

Deploying contracts with account: 0xYourAddress
Account balance: 100 DIONE

✓ EnergyToken deployed to: 0xContractAddressHere

==================================================
Creating demo energy projects...
==================================================
✓ Solar Photovoltaic project created (ID: 1)!

Project 1 Details:
  Name: Austin Solar Farm
  Location: Austin, TX
  Type: Solar
  Subtype: Photovoltaic
  Installation Size: 500 kW
  Estimated Annual Production: 650000 kWh
  Total Shares: 10000
  Price per Share: 0.01 DIONE
  kWh per Share per Year: 65
  Document URI: ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG

==================================================
DEPLOYMENT SUMMARY
==================================================
Contract Address: 0xYourContractAddress
Platform Wallet: 0xYourAddress
Demo Project ID: 1
Network: dione_testnet

✓ Deployment complete!
```

### Step 3: Save Contract Address

Copy the contract address and update your `.env`:

```
CONTRACT_ADDRESS=0xYourContractAddressFromDeployment
```

### Step 4: View Your Token on Blockchain

🎉 **Your tokens are now on the REAL Dione blockchain!**

Visit the Dione Testnet Explorer:

```
https://testnet-explorer.dioneprotocol.com/address/[YOUR_CONTRACT_ADDRESS]
```

Or try:

```
https://explorer.dioneprotocol.com/address/[YOUR_CONTRACT_ADDRESS]
```

## 📊 View Project Details

### Using Hardhat Console

```powershell
npx hardhat console --network dione_testnet
```

Then in the console:

```javascript
const EnergyToken = await ethers.getContractFactory("EnergyToken");
const energyToken = await EnergyToken.attach("0xYourContractAddress");

// Get project details
const project = await energyToken.projects(1);
const metadata = await energyToken.projectMetadata(1);

console.log("Name:", project.name);
console.log("Type:", metadata.projectType);
console.log("Total Shares:", project.totalShares.toString());
```

### Using Oracle Simulator

Start recording production data:

```powershell
cd oracle
node index.js 0xYourContractAddress 1
```

This will:

- Record hourly production data
- Update blockchain every hour
- Distribute energy credits to investors

## 🛒 Purchase Shares (Test It!)

Create a test script `scripts/purchase.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const energyToken = await hre.ethers.getContractAt(
    "EnergyToken",
    contractAddress
  );

  const projectId = 1;
  const shares = 10;
  const project = await energyToken.projects(projectId);
  const totalCost = project.pricePerShare * BigInt(shares);

  console.log(`Purchasing ${shares} shares...`);
  console.log(`Total cost: ${hre.ethers.formatEther(totalCost)} DIONE`);

  const tx = await energyToken.purchaseShares(projectId, shares, {
    value: totalCost,
  });
  await tx.wait();

  console.log("✅ Purchase successful!");
  console.log(
    `Transaction: https://testnet-explorer.dioneprotocol.com/tx/${tx.hash}`
  );

  const balance = await energyToken.balanceOf(
    (
      await hre.ethers.getSigners()
    )[0].address,
    projectId
  );
  console.log(`Your balance: ${balance} shares`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Run it:

```powershell
npx hardhat run scripts/purchase.js --network dione_testnet
```

## 🔍 Verify Your Tokens

After deployment, you can verify your tokens exist by:

1. **Blockchain Explorer**: Visit the explorer link with your contract address
2. **Check Balance**: Use the purchase script above
3. **View Events**: See all `ProjectCreated`, `SharesPurchased`, `ProductionRecorded` events on the explorer

## ⚠️ Common Issues

### "Insufficient funds"

- Get more testnet DIONE from the faucet
- Check balance: `npx hardhat run scripts/check-balance.js --network dione_testnet`

### "Network not found"

- Check `hardhat.config.js` has `dione_testnet` network configured
- Verify RPC URL is correct: `https://testnet-rpc.dioneprotocol.com`

### "Contract address not found"

- Make sure you deployed successfully
- Contract address should be in deployment output
- Update `.env` with correct `CONTRACT_ADDRESS`

### "Explorer shows 404"

- Dione explorer might be under construction
- Try alternative: Block scanner or direct RPC calls
- Your tokens still exist on-chain even if explorer is down!

## 🎉 Success Checklist

- ✅ Contract compiled successfully
- ✅ Deployed to Dione testnet (have contract address)
- ✅ Demo project created (Project ID: 1)
- ✅ Can view contract on explorer (or via console)
- ✅ Can purchase shares successfully
- ✅ Oracle simulator recording production
- ✅ Backend can interact with contract

## 🔗 Next Steps

1. **Integrate Backend**: Use your NestJS backend to interact with deployed contract
2. **Build Frontend**: Create React/Next.js interface for users
3. **Test Transactions**: Purchase shares, claim credits, view stats
4. **Deploy Oracle**: Set up automated production recording
5. **Add Projects**: Create Wind, Hydro, Geothermal projects
6. **Mainnet**: When ready, deploy to Dione mainnet

## 📞 Support

- Dione Discord: https://discord.gg/dioneprotocol
- Dione Docs: https://docs.dioneprotocol.com
- Smart Contract: Check `contracts/EnergyToken.sol`
- Backend Docs: Check `BACKEND_INTEGRATION.md`

---

**Remember**: Tests run on a LOCAL temporary blockchain. Real deployment happens with `--network dione_testnet`!
