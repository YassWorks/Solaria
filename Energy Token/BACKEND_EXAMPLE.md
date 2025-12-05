# Complete Express.js Backend Example

## Full Working Backend Server

```javascript
// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const projectRoutes = require("./routes/projects");
const userRoutes = require("./routes/users");
const productionRoutes = require("./routes/production");
const eventListener = require("./services/eventListener");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);
app.use("/api/production", productionRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Start event listener
  eventListener.start();
  console.log("📡 Blockchain event listener started");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");
  eventListener.stop();
  process.exit(0);
});

module.exports = app;
```

---

## Project Routes

```javascript
// routes/projects.js
const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const blockchain = require("../config/blockchain");

// GET /api/projects - Get all projects
router.get("/", async (req, res) => {
  try {
    const nextId = await blockchain.contract.nextProjectId();
    const projects = [];

    for (let i = 1; i < nextId; i++) {
      const project = await blockchain.contract.projects(i);
      const stats = await blockchain.contract.getProjectStats(i);

      projects.push({
        id: i,
        name: project.name,
        location: project.location,
        installationSizeKw: Number(project.installationSizeKw),
        estimatedAnnualKwh: Number(project.estimatedAnnualKwh),
        totalShares: Number(project.totalShares),
        sharesSold: Number(project.sharesSold),
        sharesAvailable:
          Number(project.totalShares) - Number(project.sharesSold),
        pricePerShare: ethers.formatEther(project.pricePerShare),
        status: ["Pending", "Active", "Completed", "Suspended"][project.status],
        totalProduction: Number(stats.totalProduction),
        documentIPFS: project.documentIPFS,
      });
    }

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/projects/:id - Get single project
router.get("/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
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
      data: {
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
        ).toISOString(),
        status: ["Pending", "Active", "Completed", "Suspended"][project.status],
        transfersEnabled: project.transfersEnabled,
        documentIPFS: project.documentIPFS,
        documentURI: documentURI,
        additionalDocuments: additionalDocs,
        stats: {
          totalProduction: Number(stats.totalProduction),
          productionRecords: Number(stats.recordCount),
          averageDailyKwh: Number(stats.averageDaily),
          lastRecorded:
            stats.lastRecordedTimestamp > 0
              ? new Date(
                  Number(stats.lastRecordedTimestamp) * 1000
                ).toISOString()
              : null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/projects/create - Create new project (Admin only)
router.post("/create", async (req, res) => {
  try {
    const {
      name,
      location,
      installationSizeKw,
      estimatedAnnualKwh,
      totalShares,
      pricePerShareETH,
      projectDurationYears = 25,
      projectWallet,
      documentIPFS = "",
    } = req.body;

    // Validation
    if (
      !name ||
      !location ||
      !installationSizeKw ||
      !estimatedAnnualKwh ||
      !totalShares ||
      !pricePerShareETH ||
      !projectWallet
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    if (!ethers.isAddress(projectWallet)) {
      return res.status(400).json({
        success: false,
        error: "Invalid project wallet address",
      });
    }

    const durationSeconds = projectDurationYears * 31536000;
    const priceWei = ethers.parseEther(pricePerShareETH.toString());

    console.log("Creating project:", name);

    const tx = await blockchain.adminContract.createProject(
      name,
      location,
      installationSizeKw,
      estimatedAnnualKwh,
      totalShares,
      priceWei,
      durationSeconds,
      projectWallet,
      documentIPFS
    );

    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // Extract projectId from event
    const projectCreatedEvent = receipt.logs
      .map((log) => {
        try {
          return blockchain.contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((event) => event && event.name === "ProjectCreated");

    const projectId = projectCreatedEvent
      ? Number(projectCreatedEvent.args.projectId)
      : null;

    res.json({
      success: true,
      data: {
        projectId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      },
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/projects/:id/purchase/prepare - Prepare purchase transaction
router.post("/:id/purchase/prepare", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { shares, userAddress } = req.body;

    if (!shares || shares <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid share amount" });
    }

    if (!ethers.isAddress(userAddress)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid user address" });
    }

    const project = await blockchain.contract.projects(projectId);
    const totalCost = project.pricePerShare * BigInt(shares);

    // Check availability
    const available = Number(project.totalShares) - Number(project.sharesSold);
    if (shares > available) {
      return res.status(400).json({
        success: false,
        error: `Only ${available} shares available`,
      });
    }

    res.json({
      success: true,
      data: {
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
          projectId,
          projectName: project.name,
          shares,
          pricePerShare: ethers.formatEther(project.pricePerShare),
          totalCost: ethers.formatEther(totalCost),
          totalCostWei: totalCost.toString(),
        },
      },
    });
  } catch (error) {
    console.error("Error preparing purchase:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

---

## User Routes

```javascript
// routes/users.js
const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const blockchain = require("../config/blockchain");

// GET /api/users/:address/portfolio - Get user portfolio
router.get("/:address/portfolio", async (req, res) => {
  try {
    const userAddress = req.params.address;

    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ success: false, error: "Invalid address" });
    }

    const nextId = await blockchain.contract.nextProjectId();
    const portfolio = [];
    let totalInvested = 0n;
    let totalClaimable = 0;

    for (let i = 1; i < nextId; i++) {
      const balance = await blockchain.contract.balanceOf(userAddress, i);

      if (balance > 0) {
        const position = await blockchain.contract.getInvestorPosition(
          i,
          userAddress
        );
        const project = await blockchain.contract.projects(i);

        totalInvested += position.totalInvested;
        totalClaimable += Number(position.claimableKwh);

        portfolio.push({
          projectId: i,
          projectName: project.name,
          location: project.location,
          shares: Number(balance),
          totalInvested: ethers.formatEther(position.totalInvested),
          totalInvestedWei: position.totalInvested.toString(),
          lifetimeKwhEarned: Number(position.lifetimeKwh),
          claimableKwh: Number(position.claimableKwh),
          estimatedAnnualKwh: Number(position.estimatedAnnualKwh),
          currentSharePrice: ethers.formatEther(project.pricePerShare),
          estimatedValue: ethers.formatEther(project.pricePerShare * balance),
        });
      }
    }

    res.json({
      success: true,
      data: {
        address: userAddress,
        totalProjectsInvested: portfolio.length,
        totalInvested: ethers.formatEther(totalInvested),
        totalClaimableKwh: totalClaimable,
        portfolio,
      },
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/users/:address/projects/:projectId - Get user position in specific project
router.get("/:address/projects/:projectId", async (req, res) => {
  try {
    const userAddress = req.params.address;
    const projectId = parseInt(req.params.projectId);

    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ success: false, error: "Invalid address" });
    }

    const balance = await blockchain.contract.balanceOf(userAddress, projectId);

    if (balance === 0n) {
      return res.json({
        success: true,
        data: { hasInvestment: false },
      });
    }

    const position = await blockchain.contract.getInvestorPosition(
      projectId,
      userAddress
    );
    const project = await blockchain.contract.projects(projectId);
    const investment = await blockchain.contract.investments(
      projectId,
      userAddress
    );

    res.json({
      success: true,
      data: {
        hasInvestment: true,
        shares: Number(balance),
        totalInvested: ethers.formatEther(position.totalInvested),
        purchaseDate: new Date(
          Number(investment.purchaseDate) * 1000
        ).toISOString(),
        lifetimeKwhEarned: Number(position.lifetimeKwh),
        claimableKwh: Number(position.claimableKwh),
        estimatedAnnualKwh: Number(position.estimatedAnnualKwh),
        averageReturnRate:
          (Number(position.lifetimeKwh) / Number(position.estimatedAnnualKwh)) *
          100,
        currentSharePrice: ethers.formatEther(project.pricePerShare),
        estimatedValue: ethers.formatEther(project.pricePerShare * balance),
      },
    });
  } catch (error) {
    console.error("Error fetching position:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users/claim/prepare - Prepare claim transaction
router.post("/claim/prepare", async (req, res) => {
  try {
    const { projectId, userAddress } = req.body;

    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ success: false, error: "Invalid address" });
    }

    const claimable = await blockchain.contract.getClaimableCredits(
      projectId,
      userAddress
    );

    if (claimable === 0n) {
      return res.status(400).json({
        success: false,
        error: "No credits available to claim",
      });
    }

    res.json({
      success: true,
      data: {
        transaction: {
          to: blockchain.contractAddress,
          value: "0",
          data: blockchain.contract.interface.encodeFunctionData(
            "claimCredits",
            [projectId]
          ),
          gasLimit: 200000,
        },
        summary: {
          projectId,
          claimableKwh: Number(claimable),
        },
      },
    });
  } catch (error) {
    console.error("Error preparing claim:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

---

## Production Routes

```javascript
// routes/production.js
const express = require("express");
const router = express.Router();
const blockchain = require("../config/blockchain");

// POST /api/production/record - Record production (Oracle only)
router.post("/record", async (req, res) => {
  try {
    const { projectId, kwhProduced, dataSource = "API" } = req.body;

    if (!projectId || !kwhProduced || kwhProduced <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid project ID or kWh amount",
      });
    }

    console.log(`Recording ${kwhProduced} kWh for project ${projectId}`);

    const tx = await blockchain.oracleContract.recordProduction(
      projectId,
      kwhProduced,
      dataSource
    );

    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // Get updated stats
    const stats = await blockchain.contract.getProjectStats(projectId);

    res.json({
      success: true,
      data: {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        kwhRecorded: kwhProduced,
        newTotalProduction: Number(stats.totalProduction),
      },
    });
  } catch (error) {
    console.error("Error recording production:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/production/:projectId/history - Get production history
router.get("/:projectId/history", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const limit = parseInt(req.query.limit) || 100;

    const filter = blockchain.contract.filters.ProductionRecorded(projectId);
    const events = await blockchain.contract.queryFilter(
      filter,
      -10000,
      "latest"
    ); // Last ~10k blocks

    const history = events
      .slice(-limit)
      .map((event) => ({
        kwhProduced: Number(event.args.kwhProduced),
        timestamp: new Date(Number(event.args.timestamp) * 1000).toISOString(),
        dataSource: event.args.dataSource,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      }))
      .reverse(); // Most recent first

    res.json({
      success: true,
      data: {
        projectId,
        recordCount: history.length,
        history,
      },
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/production/:projectId/stats - Get production statistics
router.get("/:projectId/stats", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const stats = await blockchain.contract.getProjectStats(projectId);
    const project = await blockchain.contract.projects(projectId);

    const totalProduction = Number(stats.totalProduction);
    const estimatedAnnual = Number(project.estimatedAnnualKwh);
    const percentOfEstimate =
      estimatedAnnual > 0
        ? ((totalProduction / estimatedAnnual) * 100).toFixed(2)
        : 0;

    res.json({
      success: true,
      data: {
        projectId,
        totalProduction,
        recordCount: Number(stats.recordCount),
        averageDailyKwh: Number(stats.averageDaily),
        lastRecorded:
          stats.lastRecordedTimestamp > 0
            ? new Date(Number(stats.lastRecordedTimestamp) * 1000).toISOString()
            : null,
        estimatedAnnualKwh: estimatedAnnual,
        percentOfAnnualEstimate: percentOfEstimate,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

---

## Package.json

```json
{
  "name": "energy-token-backend",
  "version": "1.0.0",
  "description": "Backend API for Energy Token smart contract",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node test/blockchain.test.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "ethers": "^6.16.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.9"
  }
}
```

---

## Run the Server

```bash
# Install dependencies
npm install

# Set up .env file (use your actual values)
cp .env.example .env

# Start server
npm start

# Or with auto-reload
npm run dev
```

---

## Test API Endpoints

```bash
# Get all projects
curl http://localhost:3000/api/projects

# Get specific project
curl http://localhost:3000/api/projects/1

# Get user portfolio
curl http://localhost:3000/api/users/0xYourAddress/portfolio

# Prepare purchase
curl -X POST http://localhost:3000/api/projects/1/purchase/prepare \
  -H "Content-Type: application/json" \
  -d '{"shares": 10, "userAddress": "0xYourAddress"}'

# Record production (Oracle)
curl -X POST http://localhost:3000/api/production/record \
  -H "Content-Type: application/json" \
  -d '{"projectId": 1, "kwhProduced": 500, "dataSource": "API"}'
```

---

**Backend is complete and ready to deploy! 🚀**
