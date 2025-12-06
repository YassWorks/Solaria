# Energy Token 🌞⚡💨

**Blockchain-based tokenized renewable energy production shares with automated credit distribution**

Energy Token is an ERC-1155 smart contract that enables fractional ownership of renewable energy installations. Each token represents a share of energy production, with credits automatically distributed to investors based on real production data.

## 🎯 Features

- **Multi-Energy Support**: Solar, Wind, Hydro, Geothermal, Biomass, and more
- **Project Classification**: Type and subtype system (e.g., Solar/Photovoltaic, Wind/Offshore)
- **Multi-Project Support**: Create and manage multiple energy projects with unique tokenization
- **Fractional Ownership**: Purchase shares representing portions of installations
- **Automated Credits**: Real-time production tracking and proportional credit distribution
- **Oracle Integration**: Production data verified and recorded on-chain
- **IPFS Documents**: Legal documents and agreements stored on IPFS
- **Platform Fees**: Built-in fee mechanism (default 2.5%)
- **Role-Based Access**: Admin, Project Manager, and Oracle roles
- **Secondary Market**: Enable/disable token transfers per project
- **Emergency Controls**: Pause functionality for security

## 📋 Project Structure

```
Energy Token/
├── contracts/
│   ├── EnergyToken.sol         # Main smart contract
│   └── Lock.sol                # Example contract
├── scripts/
│   └── deploy.js               # Deployment script
├── test/
│   └── EnergyToken.test.js     # Comprehensive test suite
├── oracle/
│   ├── index.js                # Oracle simulator
│   ├── package.json
│   └── README.md
├── hardhat.config.js           # Hardhat configuration
├── .env.example                # Environment variables template
├── PROJECT_TYPES.md            # Supported energy types guide
├── BACKEND_INTEGRATION.md      # Backend developer guide
├── BACKEND_EXAMPLE.md          # Complete API examples
└── README.md
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 20 LTS or higher
- pnpm (or npm/yarn)
- MetaMask wallet
- Test DIONE tokens from faucet

### 2. Installation

```powershell
# Clone repository
cd "Energy Token"

# Install dependencies
pnpm install

# Copy environment file
copy .env.example .env
```

### 3. Configure Environment

Edit `.env` with your values:

```env
DIONE_RPC_URL=https://testnet-rpc.dioneprotocol.com
PRIVATE_KEY=your_private_key_here
```

### 4. Compile Contracts

```powershell
npx hardhat compile
```

### 5. Run Tests

```powershell
npx hardhat test
```

Expected output:

```
  EnergyToken
    ✓ Should set the correct platform wallet
    ✓ Should create a project successfully
    ✓ Should allow purchasing shares
    ✓ Should record production data
    ✓ Should calculate claimable credits correctly
    ... (55+ tests)
```

### 6. Deploy to Dione Testnet

```powershell
npx hardhat run scripts/deploy.js --network dioneTestnet
```

Save the deployed contract address to your `.env`:

```env
CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

## 🔮 Oracle Simulator

The oracle records production data to the blockchain.

### Setup Oracle

```powershell
cd oracle
npm install
```

### Run Oracle

```powershell
# Automatic mode (records every hour)
npm start

# Record once based on current time
node index.js once

# Simulate full day of production
node index.js day

# View project statistics
node index.js stats
```

See [oracle/README.md](oracle/README.md) for detailed documentation.

## 📊 Contract Usage

### Create a Project

```javascript
const tx = await energyToken.createProject(
  "Austin Solar Farm", // name
  "Austin, TX", // location
  "Solar", // project type
  "Photovoltaic", // project subtype
  500, // 500 kW installation
  650000, // 650,000 kWh annual production
  10000, // 10,000 shares
  ethers.parseEther("0.01"), // 0.01 DIONE per share
  788400000, // 25 years in seconds
  projectWalletAddress // receives investment funds
);
```

### Purchase Shares

```javascript
const shares = 100;
const pricePerShare = ethers.parseEther("0.01");
const totalCost = pricePerShare * BigInt(shares);

await energyToken.purchaseShares(1, shares, { value: totalCost });
```

### Record Production (Oracle)

```javascript
await energyToken.recordProduction(
  1, // projectId
  500, // 500 kWh produced
  "Enphase API" // data source
);
```

### Check Credits

```javascript
const credits = await energyToken.getClaimableCredits(1, investorAddress);
console.log(`Available: ${credits} kWh`);
```

### Claim Credits

```javascript
await energyToken.claimCredits(1);
```

## 🧪 Testing

```powershell
# Run all tests
npx hardhat test

# Run with gas reporting
$env:REPORT_GAS="true"; npx hardhat test

# Run specific test file
npx hardhat test test/EnergyToken.test.js

# Run with coverage
npx hardhat coverage
```

## 🔒 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **AccessControl**: Role-based permissions
- **Pausable**: Emergency stop mechanism
- **Input Validation**: Comprehensive parameter checks
- **Safe Math**: Solidity 0.8+ overflow protection

## 🏗️ Architecture

### Token Model (ERC-1155)

- Multi-token standard for different projects
- Each project = unique token ID
- Fractional ownership via shares
- Optional secondary market trading

### Production Tracking

```
Solar Panel → Oracle → Smart Contract → Credit Distribution
                ↓
         Real Production Data
                ↓
    Proportional Share Calculation
                ↓
         Investor Credits
```

### Credit Distribution Formula

```
Investor Credits = (Total Production × Investor Shares) / Total Shares Sold
```

## 📚 Smart Contract Functions

### Public Functions

- `createProject()` - Create new solar project
- `purchaseShares()` - Buy project shares
- `claimCredits()` - Claim energy credits
- `getClaimableCredits()` - View available credits
- `getInvestorPosition()` - View investment details
- `getProjectStats()` - View project statistics

### Oracle Functions

- `recordProduction()` - Record production data

### Admin Functions

- `updateProjectStatus()` - Change project status
- `setTransfersEnabled()` - Enable/disable transfers
- `setPlatformFee()` - Update platform fee
- `pause()/unpause()` - Emergency controls

## 🌐 Network Configuration

### Dione Testnet

- **RPC URL**: https://testnet-rpc.dioneprotocol.com
- **Chain ID**: 131313
- **Currency**: DIONE
- **Explorer**: https://testnet-explorer.dioneprotocol.com

### Add to MetaMask

1. Open MetaMask → Networks → Add Network
2. Enter Dione Testnet details
3. Request test DIONE from faucet

## 🛠️ Development

### Local Development

```powershell
# Start local Hardhat node
npx hardhat node

# Deploy to local node (new terminal)
npx hardhat run scripts/deploy.js --network localhost
```

### Verify Contract (if supported)

```powershell
npx hardhat verify --network dioneTestnet DEPLOYED_CONTRACT_ADDRESS "PLATFORM_WALLET_ADDRESS"
```

## 📖 Example Workflow

1. **Project Creation**: Admin creates solar project token
2. **Investment**: Users purchase shares with DIONE
3. **Production**: Solar panels generate energy
4. **Oracle Update**: Oracle records production data on-chain
5. **Credit Distribution**: Credits calculated proportionally
6. **Claiming**: Investors claim energy credits
7. **Bill Application**: Credits applied to utility bills (future integration)

## 🤝 Contributing

Contributions welcome! Please ensure:

- All tests pass
- Code follows style guidelines
- Documentation updated

## 📄 License

MIT License - see LICENSE file

## 🔗 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ERC-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [Dione Protocol](https://dioneprotocol.com)

## 📞 Support

For issues and questions:

- Open an issue on GitHub
- Check [oracle/README.md](oracle/README.md) for oracle help
- Review test files for usage examples

---

**Built with ❤️ for a sustainable energy future**
