# Energy Token - Backend Integration Guide 🔧

## Quick Start for Backend Engineers

Hey backend team! Here's everything you need to integrate with the Energy Token smart contract.

---

## 📦 Contract Details

### Deployed Contract Information

```javascript
// After deployment, you'll have:
CONTRACT_ADDRESS = "0x..."; // From deployment output
NETWORK = "Dione Testnet";
CHAIN_ID = 131313;
RPC_URL = "https://testnet-rpc.dioneprotocol.com";
```

### Contract ABI Location

After compilation: `artifacts/contracts/EnergyToken.sol/EnergyToken.json`

---

## 🚀 Setup Backend Integration

### 1. Install Dependencies

```bash
npm install ethers dotenv
# or
pnpm add ethers dotenv
```

### 2. Environment Configuration

Create `.env` file:

```env
# Blockchain Configuration
DIONE_RPC_URL=https://testnet-rpc.dioneprotocol.com
CONTRACT_ADDRESS=0xYourDeployedContractAddress
CHAIN_ID=131313

# Private Keys (NEVER commit these!)
ADMIN_PRIVATE_KEY=your_admin_key
ORACLE_PRIVATE_KEY=your_oracle_key

# API Configuration
PORT=3000
DATABASE_URL=your_database_url
```

### 3. Basic Contract Connection

```javascript
// config/blockchain.js
const { ethers } = require("ethers");
require("dotenv").config();

// Contract ABI - only essential functions
const ENERGY_TOKEN_ABI = [
    // Read Functions
    "function projects(uint256) external view returns (tuple(string name, string location, string projectType, string projectSubtype, uint256 installationSizeKw, uint256 estimatedAnnualKwh, uint256 totalShares, uint256 sharesSold, uint256 pricePerShare, uint256 kwhPerShare, uint256 projectStartDate, uint256 projectDuration, uint8 status, address projectWallet, bool transfersEnabled, string documentIPFS))",
    "function getProject(uint256) external view returns (tuple(string, string, string, string, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint8, address, bool, string))",
    "function totalProductionByProject(uint256) external view returns (uint256)",
    "function getClaimableCredits(uint256, address) external view returns (uint256)",
    "function getInvestorPosition(uint256, address) external view returns (uint256 shares, uint256 totalInvested, uint256 lifetimeKwh, uint256 claimableKwh, uint256 estimatedAnnualKwh)",
    "function getProjectStats(uint256) external view returns (uint256 totalProduction, uint256 recordCount, uint256 averageDaily, uint256 lastRecordedTimestamp)",
    "function balanceOf(address, uint256) external view returns (uint256)",
    "function getProjectDocumentURI(uint256) external view returns (string)",
    "function getProjectDocuments(uint256) external view returns (string[])",
    "function nextProjectId() external view returns (uint256)",

    // Write Functions (Admin)
    "function createProject(string, string, string, string, uint256, uint256, uint256, uint256, uint256, address, string) external returns (uint256)",
    "function updateProjectStatus(uint256, uint8) external",
    "function updateProjectDocument(uint256, string) external",
    "function addProjectDocument(uint256, string) external", // Write Functions (Oracle)
    "function recordProduction(uint256, uint256, string) external",

    // Write Functions (User)
    "function purchaseShares(uint256, uint256) external payable",
    "function claimCredits(uint256) external",

    // Events
    "event ProjectCreated(uint256 indexed projectId, string name, uint256 totalShares, uint256 pricePerShare)",
    "event SharesPurchased(uint256 indexed projectId, address indexed investor, uint256 shares, uint256 totalCost)",
    "event ProductionRecorded(uint256 indexed projectId, uint256 kwhProduced, uint256 timestamp, string dataSource)",
    "event CreditsClaimed(uint256 indexed projectId, address indexed investor, uint256 kwhAmount)",
    "event DocumentUpdated(uint256 indexed projectId, string documentIPFS, string documentType)",
];

class BlockchainService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.DIONE_RPC_URL);
        this.contractAddress = process.env.CONTRACT_ADDRESS;

        // Read-only contract instance
        this.contract = new ethers.Contract(
            this.contractAddress,
            ENERGY_TOKEN_ABI,
            this.provider
        );

        // Admin wallet (for creating projects)
        if (process.env.ADMIN_PRIVATE_KEY) {
            this.adminWallet = new ethers.Wallet(
                process.env.ADMIN_PRIVATE_KEY,
                this.provider
            );
            this.adminContract = this.contract.connect(this.adminWallet);
        }

        // Oracle wallet (for recording production)
        if (process.env.ORACLE_PRIVATE_KEY) {
            this.oracleWallet = new ethers.Wallet(
                process.env.ORACLE_PRIVATE_KEY,
                this.provider
            );
            this.oracleContract = this.contract.connect(this.oracleWallet);
        }
    }

    // Get contract instance for specific wallet
    getContractWithSigner(privateKey) {
        const wallet = new ethers.Wallet(privateKey, this.provider);
        return this.contract.connect(wallet);
    }
}

module.exports = new BlockchainService();
```

---

## 📡 Core API Endpoints to Build

### Project Management

#### GET /api/projects

Get all projects

```javascript
// controllers/projectController.js
const blockchain = require("../config/blockchain");

async function getAllProjects(req, res) {
    try {
        const nextId = await blockchain.contract.nextProjectId();
        const projects = [];

        for (let i = 1; i < nextId; i++) {
            const project = await blockchain.contract.projects(i);
            const stats = await blockchain.contract.getProjectStats(i);
            const documentURI = await blockchain.contract.getProjectDocumentURI(
                i
            );

            projects.push({
                id: i,
                name: project.name,
                location: project.location,
                projectType: project.projectType,
                projectSubtype: project.projectSubtype,
                installationSizeKw: Number(project.installationSizeKw),
                estimatedAnnualKwh: Number(project.estimatedAnnualKwh),
                totalShares: Number(project.totalShares),
                sharesSold: Number(project.sharesSold),
                pricePerShare: ethers.formatEther(project.pricePerShare),
                kwhPerShare: Number(project.kwhPerShare),
                status: project.status, // 0=Pending, 1=Active, 2=Completed, 3=Suspended
                documentIPFS: project.documentIPFS,
                documentURI: documentURI,
                transfersEnabled: project.transfersEnabled,
                totalProduction: Number(stats.totalProduction),
                productionRecords: Number(stats.recordCount),
                averageDailyKwh: Number(stats.averageDaily),
            });
        }

        res.json({ success: true, projects });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
```

#### GET /api/projects/:id

Get single project details

```javascript
async function getProject(req, res) {
    try {
        const projectId = req.params.id;
        const project = await blockchain.contract.projects(projectId);
        const stats = await blockchain.contract.getProjectStats(projectId);
        const documentURI = await blockchain.contract.getProjectDocumentURI(
            projectId
        );
        const additionalDocs = await blockchain.contract.getProjectDocuments(
            projectId
        );

        res.json({
            success: true,
            project: {
                id: projectId,
                name: project.name,
                location: project.location,
                installationSizeKw: Number(project.installationSizeKw),
                estimatedAnnualKwh: Number(project.estimatedAnnualKwh),
                totalShares: Number(project.totalShares),
                sharesSold: Number(project.sharesSold),
                sharesAvailable:
                    Number(project.totalShares) - Number(project.sharesSold),
                pricePerShare: ethers.formatEther(project.pricePerShare),
                pricePerShareWei: project.pricePerShare.toString(),
                kwhPerShare: Number(project.kwhPerShare),
                projectStartDate: new Date(
                    Number(project.projectStartDate) * 1000
                ),
                projectDuration: Number(project.projectDuration),
                status: project.status,
                statusText: ["Pending", "Active", "Completed", "Suspended"][
                    project.status
                ],
                transfersEnabled: project.transfersEnabled,
                documentIPFS: project.documentIPFS,
                documentURI: documentURI,
                additionalDocuments: additionalDocs,
                stats: {
                    totalProduction: Number(stats.totalProduction),
                    productionRecords: Number(stats.recordCount),
                    averageDailyKwh: Number(stats.averageDaily),
                    lastRecorded: new Date(
                        Number(stats.lastRecordedTimestamp) * 1000
                    ),
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
```

#### POST /api/projects/create

Create new project (Admin only)

```javascript
async function createProject(req, res) {
    try {
        const {
            name,
            location,
            projectType,
            projectSubtype,
            installationSizeKw,
            estimatedAnnualKwh,
            totalShares,
            pricePerShareETH,
            projectDurationYears,
            projectWallet,
            documentIPFS,
        } = req.body;

        // Validate inputs
        if (
            !name ||
            !location ||
            !projectType ||
            !projectSubtype ||
            !installationSizeKw ||
            !totalShares ||
            !pricePerShareETH
        ) {
            return res
                .status(400)
                .json({ success: false, error: "Missing required fields" });
        }

        // Convert duration to seconds (years * 365 * 24 * 60 * 60)
        const durationSeconds = projectDurationYears * 31536000;
        const priceWei = ethers.parseEther(pricePerShareETH.toString());

        const tx = await blockchain.adminContract.createProject(
            name,
            location,
            projectType,
            projectSubtype,
            installationSizeKw,
            estimatedAnnualKwh,
            totalShares,
            priceWei,
            durationSeconds,
            projectWallet,
            documentIPFS || ""
        );

        const receipt = await tx.wait();

        // Get projectId from event
        const event = receipt.logs.find(
            (log) =>
                log.topics[0] ===
                ethers.id("ProjectCreated(uint256,string,uint256,uint256)")
        );
        const projectId = event ? Number(event.topics[1]) : null;

        res.json({
            success: true,
            projectId,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
```

### User Investment

#### GET /api/users/:address/portfolio

Get user's investment portfolio

```javascript
async function getUserPortfolio(req, res) {
    try {
        const userAddress = req.params.address;
        const nextId = await blockchain.contract.nextProjectId();
        const portfolio = [];

        for (let i = 1; i < nextId; i++) {
            const balance = await blockchain.contract.balanceOf(userAddress, i);

            if (balance > 0) {
                const position = await blockchain.contract.getInvestorPosition(
                    i,
                    userAddress
                );
                const project = await blockchain.contract.projects(i);

                portfolio.push({
                    projectId: i,
                    projectName: project.name,
                    shares: Number(balance),
                    totalInvested: ethers.formatEther(position.totalInvested),
                    lifetimeKwhEarned: Number(position.lifetimeKwh),
                    claimableKwh: Number(position.claimableKwh),
                    estimatedAnnualKwh: Number(position.estimatedAnnualKwh),
                    currentValue: ethers.formatEther(
                        project.pricePerShare * balance
                    ), // Simple calculation
                });
            }
        }

        res.json({ success: true, portfolio });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
```

#### POST /api/purchase

Purchase shares (User signs transaction on frontend)

```javascript
// This returns data for frontend to sign
async function preparePurchase(req, res) {
    try {
        const { projectId, shares, userAddress } = req.body;

        const project = await blockchain.contract.projects(projectId);
        const totalCost = project.pricePerShare * BigInt(shares);

        res.json({
            success: true,
            transaction: {
                to: blockchain.contractAddress,
                value: totalCost.toString(),
                data: blockchain.contract.interface.encodeFunctionData(
                    "purchaseShares",
                    [projectId, shares]
                ),
                gasLimit: 300000,
            },
            summary: {
                shares: shares,
                pricePerShare: ethers.formatEther(project.pricePerShare),
                totalCost: ethers.formatEther(totalCost),
                projectName: project.name,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
```

### Production Data

#### POST /api/production/record

Record production data (Oracle only)

```javascript
async function recordProduction(req, res) {
    try {
        const { projectId, kwhProduced, dataSource } = req.body;

        if (!kwhProduced || kwhProduced <= 0) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid kWh amount" });
        }

        const tx = await blockchain.oracleContract.recordProduction(
            projectId,
            kwhProduced,
            dataSource || "API"
        );

        const receipt = await tx.wait();

        res.json({
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            kwhRecorded: kwhProduced,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
```

#### GET /api/production/:projectId/history

Get production history

```javascript
// You'll need to listen to events for this
async function getProductionHistory(req, res) {
    try {
        const projectId = req.params.id;

        // Query ProductionRecorded events
        const filter =
            blockchain.contract.filters.ProductionRecorded(projectId);
        const events = await blockchain.contract.queryFilter(
            filter,
            0,
            "latest"
        );

        const history = events.map((event) => ({
            kwhProduced: Number(event.args.kwhProduced),
            timestamp: new Date(Number(event.args.timestamp) * 1000),
            dataSource: event.args.dataSource,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
        }));

        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
```

---

## 🎧 Event Listeners (WebSocket/Polling)

### Listen for Real-time Events

```javascript
// services/eventListener.js
const blockchain = require("../config/blockchain");

class EventListener {
    constructor() {
        this.listeners = [];
    }

    start() {
        console.log("Starting blockchain event listener...");

        // Listen for new projects
        blockchain.contract.on(
            "ProjectCreated",
            (projectId, name, totalShares, pricePerShare, event) => {
                console.log("New project created:", {
                    projectId: Number(projectId),
                    name,
                });
                // Save to database, notify users, etc.
                this.handleNewProject({
                    projectId: Number(projectId),
                    name,
                    totalShares,
                    pricePerShare,
                });
            }
        );

        // Listen for share purchases
        blockchain.contract.on(
            "SharesPurchased",
            (projectId, investor, shares, totalCost, event) => {
                console.log("Shares purchased:", {
                    projectId: Number(projectId),
                    investor,
                    shares: Number(shares),
                    amount: ethers.formatEther(totalCost),
                });
                // Update database, send confirmation email, etc.
                this.handleSharePurchase({
                    projectId,
                    investor,
                    shares,
                    totalCost,
                });
            }
        );

        // Listen for production records
        blockchain.contract.on(
            "ProductionRecorded",
            (projectId, kwhProduced, timestamp, dataSource, event) => {
                console.log("Production recorded:", {
                    projectId: Number(projectId),
                    kwhProduced: Number(kwhProduced),
                    dataSource,
                });
                // Update stats, notify investors, etc.
                this.handleProductionRecorded({
                    projectId,
                    kwhProduced,
                    timestamp,
                    dataSource,
                });
            }
        );

        // Listen for credit claims
        blockchain.contract.on(
            "CreditsClaimed",
            (projectId, investor, kwhAmount, event) => {
                console.log("Credits claimed:", {
                    projectId: Number(projectId),
                    investor,
                    kwhAmount: Number(kwhAmount),
                });
                // Update database, process utility credits, etc.
                this.handleCreditsClaimed({ projectId, investor, kwhAmount });
            }
        );
    }

    async handleNewProject(data) {
        // Your database logic here
        // await db.projects.create({ ... });
    }

    async handleSharePurchase(data) {
        // Your database logic here
        // await db.investments.create({ ... });
    }

    async handleProductionRecorded(data) {
        // Your database logic here
        // await db.production.create({ ... });
    }

    async handleCreditsClaimed(data) {
        // Your database logic here
        // await db.claims.create({ ... });
    }

    stop() {
        blockchain.contract.removeAllListeners();
        console.log("Event listener stopped");
    }
}

module.exports = new EventListener();
```

---

## 🗄️ Recommended Database Schema

```sql
-- Projects (cache blockchain data)
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255),
  location VARCHAR(255),
  installation_size_kw INTEGER,
  estimated_annual_kwh INTEGER,
  total_shares INTEGER,
  shares_sold INTEGER,
  price_per_share VARCHAR(50),
  document_ipfs VARCHAR(255),
  status INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- User Investments
CREATE TABLE investments (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42),
  project_id INTEGER,
  shares INTEGER,
  total_invested VARCHAR(50),
  purchase_date TIMESTAMP,
  transaction_hash VARCHAR(66)
);

-- Production Records
CREATE TABLE production_records (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  kwh_produced INTEGER,
  data_source VARCHAR(100),
  recorded_at TIMESTAMP,
  transaction_hash VARCHAR(66),
  block_number INTEGER
);

-- Credit Claims
CREATE TABLE credit_claims (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42),
  project_id INTEGER,
  kwh_amount INTEGER,
  claimed_at TIMESTAMP,
  transaction_hash VARCHAR(66),
  status VARCHAR(50) -- pending, processed, applied_to_bill
);

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE,
  email VARCHAR(255),
  created_at TIMESTAMP
);
```

---

## 🔐 Security Considerations

1. **Private Keys**: NEVER expose private keys in frontend or logs
2. **Rate Limiting**: Implement rate limiting on all endpoints
3. **Input Validation**: Validate all user inputs before blockchain calls
4. **Gas Estimation**: Always estimate gas before transactions
5. **Error Handling**: Implement proper error handling for failed transactions
6. **Address Validation**: Use `ethers.isAddress()` to validate addresses

---

## 🧪 Testing Your Backend

```javascript
// test/blockchain.test.js
const blockchain = require("../config/blockchain");

async function testBlockchainConnection() {
    try {
        console.log("Testing blockchain connection...");

        // Test 1: Get next project ID
        const nextId = await blockchain.contract.nextProjectId();
        console.log("✓ Next Project ID:", Number(nextId));

        // Test 2: Get project details
        if (nextId > 1) {
            const project = await blockchain.contract.projects(1);
            console.log("✓ Project 1:", project.name);
        }

        // Test 3: Check balance
        const balance = await blockchain.provider.getBalance(
            blockchain.adminWallet.address
        );
        console.log("✓ Admin Balance:", ethers.formatEther(balance), "DIONE");

        console.log("\n✅ All tests passed!");
    } catch (error) {
        console.error("❌ Test failed:", error.message);
    }
}

testBlockchainConnection();
```

---

## 🆘 Common Issues & Solutions

### Issue: "Invalid Address"

```javascript
// Solution: Validate addresses
if (!ethers.isAddress(userAddress)) {
    throw new Error("Invalid Ethereum address");
}
```

### Issue: "Insufficient Gas"

```javascript
// Solution: Estimate and add buffer
const gasEstimate = await contract.estimateGas.purchaseShares(
    projectId,
    shares,
    { value }
);
const gasLimit = (gasEstimate * 120n) / 100n; // 20% buffer
```

### Issue: "Transaction Reverted"

```javascript
// Solution: Handle revert reasons
try {
    const tx = await contract.someFunction();
    await tx.wait();
} catch (error) {
    if (error.reason) {
        console.error("Revert reason:", error.reason);
    }
    // Handle specific errors
}
```

---

## 📞 Need Help?

-   Contract source: `contracts/EnergyToken.sol`
-   Tests: `test/EnergyToken.test.js`
-   Deployment script: `scripts/deploy.js`
-   Oracle example: `oracle/index.js`
-   GreenNumber: 25217470

**Your backend is ready to rock! 🎸**
