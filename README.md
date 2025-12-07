<div align="center">

<img src="mobile/assets/logo.jpg" alt="Solaria Logo" width="200"/>

# ☀️ Solaria

**Backend API:** [Swagger](https://solaria-lav5.onrender.com/api) | **AI API:** [Swagger](https://solaria-a5mp.onrender.com/docs)

### Democratizing Renewable Energy Investment Through Blockchain

**Tokenized renewable energy production shares with AI-powered predictions and automated credit distribution**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Blockchain](https://img.shields.io/badge/Blockchain-ERC--1155-blue.svg)](https://docs.openzeppelin.com/contracts/4.x/erc1155)
[![Flutter](https://img.shields.io/badge/Flutter-3.8.1-02569B?logo=flutter)](https://flutter.dev)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs)](https://nestjs.com)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python)](https://python.org)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.27-FFF100?logo=ethereum)](https://hardhat.org)

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🌍 Overview

Solaria is a comprehensive blockchain-based platform that enables fractional ownership of renewable energy installations. By combining smart contracts, AI-powered predictions, and a user-friendly mobile application, Solaria makes green energy investment accessible to everyone.

### The Problem We Solve

- **High Entry Barriers**: Traditional renewable energy investments require significant capital
- **Lack of Transparency**: Investors struggle to verify actual energy production
- **Complex Management**: Tracking returns and credits is manually intensive
- **Limited Access**: Small investors are excluded from lucrative renewable projects

### Our Solution

Solaria tokenizes renewable energy installations as ERC-1155 tokens, allowing anyone to purchase shares and receive proportional energy credits based on real-time production data verified by oracles and predicted by AI models.

---

## ✨ Features

### 🔐 Blockchain Foundation
- **Multi-Energy Support**: Solar, Wind, Hydro, Geothermal, Biomass, and more
- **Fractional Ownership**: Purchase shares representing portions of installations
- **Automated Credits**: Real-time production tracking and proportional distribution
- **Secure Wallets**: AES-256-GCM encrypted wallet storage with PBKDF2 key derivation
- **Smart Contracts**: Auditable, transparent, and immutable transactions
- **Secondary Market**: Enable/disable token transfers per project

### 🤖 AI-Powered Predictions
- **Energy Yield Forecasting**: ML models predict kWh output per share
- **Ensemble Learning**: CatBoost, XGBoost, and LightGBM combined predictions
- **Quality Control**: Automated monitoring and anomaly detection
- **Smart Data Lookup**: Auto-fills missing technical data using dataset intelligence
- **MLOps Pipeline**: Continuous training and model optimization

### 📱 Mobile Experience
- **Cross-Platform**: iOS, Android, Web, Windows, macOS, and Linux
- **Real-Time Dashboard**: Track investments and energy production
- **Secure Authentication**: JWT-based auth with encrypted local storage
- **Project Discovery**: Browse and invest in renewable energy projects
- **Credit Claims**: One-tap credit claiming directly from mobile

### 🔧 Enterprise Backend
- **RESTful API**: NestJS-powered scalable architecture
- **MongoDB Integration**: Flexible data modeling for complex relationships
- **Role-Based Access**: Admin, Project Manager, Oracle, and Investor roles
- **Email Notifications**: Automated updates via Nodemailer
- **Swagger Documentation**: Interactive API documentation
- **Security First**: Input validation, rate limiting, and encryption

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SOLARIA ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐  │
│  │              │     │              │     │             │  │
│  │   Mobile     │────▶│   Backend    │────▶│  Blockchain│  │
│  │   (Flutter)  │     │   (NestJS)   │     │  (Hardhat)  │  │
│  │              │     │              │     │             │  │
│  └──────────────┘     └──────────────┘     └─────────────┘  │
│         │                    │                     │        │
│         │                    ▼                     │        │
│         │             ┌──────────────┐             │        │
│         │             │              │             │        │
│         └────────────▶│   MongoDB    │◀────────────┘       │
│                       │              │                      │
│                       └──────────────┘                      │
│                              │                              │
│                              ▼                              │
│                    ┌──────────────────┐                     │
│                    │                  │                     │
│                    │   AI Services    │                     │
│                    │  (Python/FastAPI)│                     │
│                    │                  │                     │
│                    └──────────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Flutter 3.8.1**: Cross-platform mobile framework
- **Riverpod**: State management and dependency injection
- **Go Router**: Type-safe navigation

#### Backend
- **NestJS 11**: Progressive Node.js framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT Authentication**: Secure token-based auth
- **Passport**: Authentication middleware
- **Swagger**: API documentation

#### Blockchain
- **Hardhat**: Ethereum development environment
- **OpenZeppelin**: Audited smart contract library
- **ERC-1155**: Multi-token standard
- **Ethers.js**: Blockchain interaction library
- **Dione Protocol**: Target blockchain network

#### AI/ML
- **FastAPI**: High-performance Python API framework
- **CatBoost, XGBoost, LightGBM**: Gradient boosting models
- **Pandas & NumPy**: Data processing
- **Scikit-learn**: ML utilities
- **Docker**: Containerized deployments

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20 LTS or higher
- **pnpm** (recommended) or npm
- **Flutter** 3.8.1 or higher
- **Python** 3.9 or higher
- **MongoDB** 6.0 or higher
- **Docker** (for AI services)

### 1. Clone the Repository

```bash
git clone https://github.com/YassWorks/HackFST.git
cd HackFST
```

### 2. Setup Blockchain Contracts

```bash
cd energy_token
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Compile contracts
pnpm hardhat compile

# Deploy to testnet
pnpm hardhat ignition deploy ./ignition/modules/EnergyToken.js --network dioneTestnet

# Run tests
pnpm hardhat test
```

### 3. Setup Backend

```bash
cd ../backend
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with MongoDB URI, JWT secrets, contract address, etc.

# Run migrations (if any)
pnpm run migration:run

# Start development server
pnpm run start:dev
```

The backend will be available at `http://localhost:3000`

API documentation: `http://localhost:3000/api`

### 4. Setup Mobile App

```bash
cd ../mobile
flutter pub get

# Run on your preferred platform
flutter run -d chrome      # Web
flutter run -d android     # Android
flutter run -d ios         # iOS
flutter run -d windows     # Windows
flutter run -d macos       # macOS
flutter run -d linux       # Linux
```

### 5. Setup AI Services

```bash
cd ../ai

# Energy Prediction Service
cd pow_predict
docker-compose up -d

# Quality Control Service
cd ../quality_control
docker-compose up -d
```

---

## 📚 Documentation

### Project Structure

```
Solaria/
├── energy_token/          # Smart contracts and blockchain
│   ├── contracts/         # Solidity contracts
│   ├── scripts/           # Deployment scripts
│   ├── test/              # Contract tests
│   ├── oracle/            # Production data oracle
│   └── docs/              # Blockchain documentation
│
├── backend/               # NestJS REST API
│   ├── src/
│   │   ├── auth/         # Authentication module
│   │   ├── blockchain/   # Smart contract integration
│   │   ├── projects/     # Project management
│   │   ├── investors/    # Investor management
│   │   ├── transactions/ # Transaction handling
│   │   └── user/         # User management
│   └── test/             # API tests
│
├── mobile/                # Flutter mobile app
│   ├── lib/
│   │   ├── models/       # Data models
│   │   ├── pages/        # UI screens
│   │   ├── services/     # API services
│   │   ├── state/        # State management
│   │   ├── widgets/      # Reusable components
│   │   └── router/       # Navigation
│   └── assets/           # Images and resources
│
└── ai/                    # AI/ML services
    ├── pow_predict/       # Energy prediction API
    │   ├── models/       # Trained ML models
    │   ├── data/         # Training datasets
    │   └── pipeline.py   # MLOps pipeline
    └── quality_control/   # Production quality monitoring
        └── src/          # QC algorithms
```

### Key Documentation Files

- [Energy Token README](./energy_token/README.md) - Smart contract documentation
- [Backend Integration Guide](./energy_token/BACKEND_INTEGRATION.md) - Backend API integration
- [Project Types](./energy_token/PROJECT_TYPES.md) - Supported energy project types
- [Purchase Security](./backend/PURCHASE_SECURITY.md) - Wallet security implementation
- [Testing Purchase Flow](./backend/TESTING_PURCHASE_FLOW.md) - End-to-end testing guide
- [Energy Prediction API](./ai/pow_predict/README.md) - AI model documentation

---

## 🔑 Key Concepts

### Project Lifecycle

1. **Creation**: Admin creates project with details (location, capacity, pricing)
2. **Active**: Project opens for investment, shares available for purchase
3. **Operational**: Installation complete, production data recorded by oracles
4. **Credit Distribution**: Investors claim proportional energy credits
5. **Maturity**: Project reaches end of lifecycle, final settlements

### Token Economics

- **ERC-1155**: Each project has unique token ID
- **Shares**: Fixed supply per project based on installation capacity
- **Pricing**: Dynamic pricing based on project metrics
- **Platform Fee**: 2.5% fee on all share purchases
- **Credits**: Claimable energy credits (kWh) proportional to ownership

### Security Features

- **Wallet Encryption**: AES-256-GCM with PBKDF2 key derivation (100,000 iterations)
- **Password Protection**: User passwords never stored, only used for encryption
- **Memory Safety**: Private keys cleared immediately after use
- **Role-Based Access**: Granular permissions for different user types
- **Oracle Verification**: Production data verified by authorized oracles
- **Emergency Pause**: Circuit breaker for security incidents

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

### Smart Contract Tests

```bash
cd energy_token

# Run all tests
pnpm hardhat test

# Test coverage
pnpm hardhat coverage

# Gas reporting
REPORT_GAS=true pnpm hardhat test
```

### Mobile Tests

```bash
cd mobile

# Run tests
flutter test

# Test coverage
flutter test --coverage
```

---

## 🌐 Deployment

### Blockchain Deployment

```bash
cd energy_token

# Deploy to mainnet
pnpm hardhat ignition deploy ./ignition/modules/EnergyToken.js --network dionenet

# Verify contract
pnpm hardhat verify --network dionenet DEPLOYED_CONTRACT_ADDRESS
```

### Backend Deployment

```bash
cd backend

# Build production
pnpm run build

# Start production server
pnpm run start:prod
```

### Mobile Deployment

```bash
cd mobile

# Build for Android
flutter build apk --release

# Build for iOS
flutter build ios --release

# Build for Web
flutter build web --release
```

### AI Services Deployment

```bash
cd ai

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```
---

## 📊 Project Status

- [x] Smart contract implementation (ERC-1155)
- [x] Backend API with authentication
- [x] Mobile app (iOS, Android, Web)
- [x] AI energy prediction models
- [x] Wallet encryption and security
- [x] Oracle integration
- [x] Credit distribution system
- [ ] Secondary marketplace
- [ ] Advanced analytics dashboard
- [ ] Multi-chain support
- [ ] DAO governance

---

## Tools

- [OpenZeppelin](https://openzeppelin.com/) - Secure smart contract library
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Flutter](https://flutter.dev/) - Beautiful cross-platform apps
- [Dione Protocol](https://dioneprotocol.com/) - Blockchain infrastructure
- [Hardhat](https://hardhat.org/) - Ethereum development environment

---

<div align="center">

### ⭐ Star us on GitHub — it motivates us a lot!

**Made with ☀️ for a sustainable future**

[⬆ Back to Top](#️-solaria)

</div>
