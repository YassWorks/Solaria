import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

describe('BlockchainService - Live Blockchain Tests', () => {
  let service: BlockchainService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const config = {
                DIONE_RPC_URL: process.env.DIONE_RPC_URL,
                CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
                PRIVATE_KEY: process.env.PRIVATE_KEY,
              };
              return config[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
    await service.onModuleInit();
  });

  describe('Connection Tests', () => {
    it('should connect to Dione testnet', async () => {
      const provider = service.getProvider();
      const network = await provider.getNetwork();

      expect(network.chainId).toBe(131313n);
    });

    it('should initialize contract at correct address', () => {
      const contract = service.getContract();
      expect(contract.target).toBe(
        '0x46b95E77B72d3e973853150d91bF7aB00f0d3dC7',
      );
    });

    it('should get current gas price from network', async () => {
      const gasPrice = await service.getGasPrice();
      const gasPriceNum = parseFloat(gasPrice);

      expect(gasPriceNum).toBeGreaterThan(0);
      console.log(`Current gas price: ${gasPrice} gwei`);
    });
  });
  describe('Project Tests - Austin Solar Farm (Live Data)', () => {
    it('should read Austin Solar Farm from blockchain (Project ID: 1)', async () => {
      const project = await service.getProject(1);

      console.log('\n📊 Austin Solar Farm Data from Blockchain:');
      console.log(JSON.stringify(project, null, 2));

      // Verify exact deployment parameters
      expect(project.id).toBe(1);
      expect(project.name).toBe('Austin Solar Farm');
      expect(project.location).toBe('Austin, TX');
      expect(project.projectType).toBe('Solar');
      expect(project.projectSubtype).toBe('Photovoltaic');
      expect(project.installationSizeKw).toBe(500);
      expect(project.estimatedAnnualKwh).toBe(650000);
      expect(project.totalShares).toBe(10000);
      expect(project.pricePerShare).toBe('0.01');
      expect(project.projectDuration).toBe(788400000);
      expect(project.documentIPFS).toBe(
        'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      );

      // Verify blockchain state fields
      expect(project.projectWallet).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(typeof project.status).toBe('number');
      expect(typeof project.sharesSold).toBe('number');
      expect(typeof project.transfersEnabled).toBe('boolean');
      expect(typeof project.projectStartDate).toBe('number');
    });

    it('should get all projects from blockchain', async () => {
      const projects = await service.getAllProjects();

      console.log(`\n📋 Total projects on blockchain: ${projects.length}`);
      projects.forEach((p) => {
        console.log(`  - Project ${p.id}: ${p.name} (${p.projectType})`);
      });

      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);

      const austinProject = projects.find((p) => p.id === 1);
      expect(austinProject).toBeDefined();
      expect(austinProject?.name).toBe('Austin Solar Farm');
    });

    it('should get live project statistics', async () => {
      const stats = await service.getProjectStats(1);

      console.log('\n📈 Austin Solar Farm Statistics:');
      console.log(`  Total Production: ${stats.totalProduction} kWh`);
      console.log(`  Record Count: ${stats.recordCount}`);
      console.log(`  Average Daily: ${stats.averageDaily} kWh`);
      console.log(
        `  Last Recorded: ${new Date(stats.lastRecordedTimestamp * 1000).toISOString()}`,
      );

      expect(stats.totalProduction).toBeGreaterThanOrEqual(0);
      expect(stats.recordCount).toBeGreaterThanOrEqual(0);
      expect(stats.averageDaily).toBeGreaterThanOrEqual(0);
      expect(stats.lastRecordedTimestamp).toBeGreaterThanOrEqual(0);
    });

    it('should get production history from blockchain', async () => {
      const history = await service.getProductionHistory(1, 100);

      console.log(`\n⚡ Production Records: ${history.length} entries`);
      if (history.length > 0) {
        console.log('Latest 3 records:');
        history.slice(-3).forEach((record) => {
          console.log(
            `  ${new Date(record.timestamp * 1000).toISOString()}: ${record.kwhProduced} kWh (${record.dataSource})`,
          );
        });
      }

      expect(Array.isArray(history)).toBe(true);

      history.forEach((record) => {
        expect(record.timestamp).toBeGreaterThan(0);
        expect(record.kwhProduced).toBeGreaterThanOrEqual(0);
        expect(record.cumulativeKwh).toBeGreaterThanOrEqual(0);
        expect(typeof record.dataSource).toBe('string');
      });
    });
  });

  describe('Investor Tests (Live Data)', () => {
    it('should get investor position from blockchain', async () => {
      const project = await service.getProject(1);
      const investorAddress = project.projectWallet;

      const position = await service.getInvestorPosition(1, investorAddress);

      console.log(`\n👤 Investor Position (${investorAddress}):`);
      console.log(`  Shares: ${position.shares}`);
      console.log(`  Total Invested: ${position.totalInvested} DIONE`);
      console.log(`  Lifetime kWh: ${position.lifetimeKwh}`);
      console.log(`  Claimable kWh: ${position.claimableKwh}`);
      console.log(`  Est. Annual kWh: ${position.estimatedAnnualKwh}`);

      expect(position.shares).toBeGreaterThanOrEqual(0);
      expect(typeof position.totalInvested).toBe('string');
      expect(position.lifetimeKwh).toBeGreaterThanOrEqual(0);
      expect(position.claimableKwh).toBeGreaterThanOrEqual(0);
      expect(position.estimatedAnnualKwh).toBeGreaterThanOrEqual(0);
    });

    it('should get claimable energy credits from blockchain', async () => {
      const project = await service.getProject(1);
      const investorAddress = project.projectWallet;

      const credits = await service.getClaimableCredits(1, investorAddress);

      console.log(`\n⚡ Claimable Energy Credits: ${credits} kWh`);

      expect(typeof credits).toBe('number');
      expect(credits).toBeGreaterThanOrEqual(0);
    });

    it('should get complete user portfolio from blockchain', async () => {
      const project = await service.getProject(1);
      const userAddress = project.projectWallet;

      const portfolio = await service.getUserPortfolio(userAddress);

      console.log(`\n💼 Portfolio for ${userAddress}:`);
      console.log(`  Total Projects: ${portfolio.length}`);
      portfolio.forEach((item) => {
        console.log(
          `  - ${item.project.name}: ${item.sharesOwned} shares, ${item.position.lifetimeKwh} kWh lifetime`,
        );
      });

      expect(Array.isArray(portfolio)).toBe(true);

      portfolio.forEach((item) => {
        expect(item.project).toBeDefined();
        expect(item.position).toBeDefined();
        expect(item.sharesOwned).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Write Operations (Admin only - requires PRIVATE_KEY)', () => {
    it('should create a new test project', async () => {
      if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.length < 64) {
        console.log('⚠️  Skipping - Set PRIVATE_KEY env variable to test');
        return;
      }

      const project = await service.getProject(1);
      const deployerAddress = project.projectWallet;

      const projectParams = {
        name: 'Test Wind Farm',
        location: 'Test Location, USA',
        projectType: 'Wind',
        projectSubtype: 'Offshore',
        installationSizeKw: 200,
        estimatedAnnualKwh: 300000,
        totalShares: 5000,
        pricePerShare: '0.02',
        projectDuration: 788400000,
        projectWallet: deployerAddress,
        documentIPFS: 'QmTestIPFSHash123',
      };

      console.log('\n🔄 Creating new project on blockchain...');

      const result = await service.createProject(projectParams);

      console.log(`✅ Project Created! ID: ${result.projectId}`);
      console.log(`📝 Transaction Hash: ${result.transactionHash}`);
      console.log(`⛽ Gas Used: ${result.gasUsed}`);

      expect(result.success).toBe(true);
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.projectId).toBeGreaterThan(0);
    }, 60000);

    it('should update project status', async () => {
      if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.length < 64) {
        console.log('⚠️  Skipping - Set PRIVATE_KEY env variable to test');
        return;
      }

      const projectId = 1;
      const newStatus = 1; // Active

      console.log(
        `\n🔄 Updating project ${projectId} status to ${newStatus}...`,
      );

      const result = await service.updateProjectStatus(projectId, newStatus);

      console.log(`✅ Transaction Hash: ${result.transactionHash}`);
      console.log(`⛽ Gas Used: ${result.gasUsed}`);

      expect(result.success).toBe(true);
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    }, 60000);
  });
});
