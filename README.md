# 🌞 Solaria: AI-Powered Decentralized Renewable Energy Investment Platform

## 🌍 Project Overview

Solaria is an **AI-powered decentralized renewable energy investment
platform** that allows individuals to own, trade, and utilize real
renewable energy production through **blockchain tokenization**.

At its core, Solaria transforms large-scale renewable energy
infrastructures (solar, wind, hydro, geothermal) into fractional,
on-chain assets accessible from as little as **\$100**, while delivering
real-world utility in the form of **energy credits** that reduce
electricity bills.

Unlike traditional green investments that are **illiquid, opaque, and
exclusive to institutions**, Solaria combines blockchain transparency
with AI intelligence to provide:

-   Real-time visibility\
-   Predictive insights\
-   Measurable environmental impact

------------------------------------------------------------------------

## 💡 What Makes Solaria Different

Solaria is not just a tokenization platform --- **it is a full energy
intelligence system**.

  -----------------------------------------------------------------------
  Feature                     Description
  --------------------------- -------------------------------------------
  **Real Utility**            Token holders earn **kWh-based energy
                              credits** that can offset electricity bills
                              or be monetized. Tied to real production.

  **AI-Driven Decision        Four AI services: Production Forecasting,
  Making**                    Portfolio Optimization, Underperformance
                              Detection, Savings Calculator.

  **Blockchain Transparency** ERC‑1155 smart contracts + Oracles
                              recording verified production data
                              on-chain. Real-time tracking.

  **Liquidity &               Entry from \~\$100. Fractional ERC‑1155
  Accessibility**             assets. No 15--25 year lockups. Secondary
                              market enabled.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 🏗️ End-to-End Architecture (Monorepo)

The Solaria monorepo contains all production components of the
decentralized ecosystem.

### **Project Structure**

    Solaria/
    ├── mobile/             # Flutter Mobile App
    ├── backend/            # NestJS Backend API
    ├── contracts/
    │   ├── EnergyToken.sol       # Main smart contract
    │   └── Lock.sol              # Example contract
    ├── oracle/
    │   ├── index.js              # Oracle simulator
    │   └── README.md
    ├── hardhat.config.js         # Hardhat configuration
    └── README.md                 # This file

------------------------------------------------------------------------

## ⚡ Energy Token --- ERC‑1155 Smart Contract

### 🎯 Features

-   **Multi-Energy Support** (Solar, Wind, Hydro, Geothermal...)
-   **Fractional Ownership**
-   **Automated Credit Distribution**
-   **Oracle Integration**
-   **Security** (ReentrancyGuard, AccessControl, Pausable)
-   **Secondary Market Control**

------------------------------------------------------------------------

# 🚀 Quick Start --- Smart Contracts

## 1. Prerequisites

-   Node.js 20 LTS+
-   pnpm / npm / yarn
-   MetaMask wallet
-   Test DIONE tokens (faucet)

## 2. Installation

``` powershell
cd contracts
pnpm install
copy .env.example .env
```

Add your **DIONE_RPC_URL** and **PRIVATE_KEY**.

## 3. Compile, Test & Deploy

``` powershell
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network dioneTestnet
```

Save deployed address in `.env` as `CONTRACT_ADDRESS`.

------------------------------------------------------------------------

# 💻 Backend API (NestJS)

The backend handles: - Business logic\
- AI orchestration\
- Blockchain interaction\
- Mobile API services

### Run Backend

``` powershell
cd backend
pnpm install
copy .env.example .env
pnpm run start:dev
```

### Swagger Documentation

Open:

    http://localhost:5000/api

------------------------------------------------------------------------

# 📱 Mobile App (Flutter)

### Run Mobile App

``` powershell
cd mobile
flutter pub get
flutter run
```

Ensure backend runs at `http://localhost:5000`.

------------------------------------------------------------------------

# 🔮 Oracle Simulator

### Running Oracle

``` powershell
cd oracle
npm install
npm start
```

Oracle sends verified production data on-chain every hour.

------------------------------------------------------------------------

# 📊 Contract Usage & Credit Distribution

### Formula

    Investor Credits = (Total Production × Investor Shares) / Total Shares Sold

### Core Functions

  Function               Role
  ---------------------- ------------------------------
  `createProject()`      Launch new tokenized project
  `purchaseShares()`     User investment
  `recordProduction()`   Oracle‑verified data
  `claimCredits()`       Redeem energy credits

------------------------------------------------------------------------

# 🌱 Environmental & Social Impact

Solaria contributes to: - Lower carbon emissions\
- Accelerated renewable deployment\
- Democratized green investing

Each investment tracks: - kWh produced\
- CO₂ avoided\
- Real-world environmental equivalents

------------------------------------------------------------------------

# 🎯 Vision

Solaria bridges the **\$500B/year renewable energy market** with: -
Blockchain trust\
- AI intelligence\
- Tangible utility-backed returns

A win‑win‑win for: - **Investors** - **Renewable project owners** -
**Society**

------------------------------------------------------------------------

# 🤝 Contributing & Support

Contributions are welcome!\
Please ensure: - All tests pass\
- Documentation is updated

Resources:\
- Hardhat Docs\
- OpenZeppelin Contracts\
- ERC‑1155 Standard

------------------------------------------------------------------------

**Built with ❤️ for a sustainable energy future.**
