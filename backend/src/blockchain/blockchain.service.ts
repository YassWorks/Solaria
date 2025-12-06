import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as EnergyTokenABI from './artifacts/EnergyToken.json';

export interface ProjectParams {
  name: string;
  location: string;
  projectType: string;
  projectSubtype: string;
  installationSizeKw: number;
  estimatedAnnualKwh: number;
  totalShares: number;
  pricePerShare: string; // in DIONE (e.g., "0.01")
  projectDuration: number;
  projectWallet: string;
  documentIPFS: string;
}

export interface Project {
  id: number;
  name: string;
  location: string;
  installationSizeKw: number;
  estimatedAnnualKwh: number;
  totalShares: number;
  sharesSold: number;
  pricePerShare: string;
  projectStartDate: number;
  status: number;
  projectWallet: string;
  transfersEnabled: boolean;
  projectType: string;
  projectSubtype: string;
  documentIPFS: string;
  projectDuration: number;
}

export interface InvestorPosition {
  shares: number;
  totalInvested: string;
  lifetimeKwh: number;
  claimableKwh: number;
  estimatedAnnualKwh: number;
}

export interface ProjectStats {
  totalProduction: number;
  recordCount: number;
  averageDaily: number;
  lastRecordedTimestamp: number;
}

export interface ProductionRecord {
  timestamp: number;
  kwhProduced: number;
  cumulativeKwh: number;
  dataSource: string;
}

export interface TransactionResult {
  success: boolean;
  transactionHash: string;
  gasUsed: string;
  projectId?: number;
}

export interface PortfolioItem {
  project: Project;
  position: InvestorPosition;
  sharesOwned: number;
}

export interface ProjectCreatedEvent {
  projectId: number;
  name: string;
  totalShares: number;
  pricePerShare: string;
  transactionHash: string;
}

export interface SharesPurchasedEvent {
  projectId: number;
  investor: string;
  shares: number;
  totalCost: string;
  transactionHash: string;
}

export interface ProductionRecordedEvent {
  projectId: number;
  kwhProduced: number;
  timestamp: number;
  dataSource: string;
  transactionHash: string;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private adminWallet: ethers.Wallet;
  private oracleWallet: ethers.Wallet;

  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      const rpcUrl = this.configService.get<string>('DIONE_RPC_URL');
      const contractAddress =
        this.configService.get<string>('CONTRACT_ADDRESS');
      const adminKey = this.configService.get<string>('PRIVATE_KEY');
      const oracleKey = this.configService.get<string>('ORACLE_PRIVATE_KEY');

      if (!rpcUrl || !contractAddress || !adminKey) {
        const missing: string[] = [];
        if (!rpcUrl) missing.push('DIONE_RPC_URL');
        if (!contractAddress) missing.push('CONTRACT_ADDRESS');
        if (!adminKey) missing.push('PRIVATE_KEY');

        throw new Error(
          `Missing required environment variables for blockchain connection: ${missing.join(', ')}`,
        );
      }

      this.logger.log(`Connecting to RPC: ${rpcUrl}`);
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      this.adminWallet = new ethers.Wallet(adminKey, this.provider);

      if (oracleKey) {
        this.oracleWallet = new ethers.Wallet(oracleKey, this.provider);
      } else {
        this.logger.warn(
          'Oracle private key not provided - oracle functions will not be available',
        );
        this.oracleWallet = this.adminWallet; // Fallback to admin wallet
      }

      this.contract = new ethers.Contract(
        contractAddress,
        EnergyTokenABI.abi,
        this.adminWallet,
      );

      // Test connection
      const network = await this.provider.getNetwork();
      this.logger.log(
        `✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`,
      );

      const balance = await this.provider.getBalance(this.adminWallet.address);
      this.logger.log(
        `Admin wallet balance: ${ethers.formatEther(balance)} DIONE`,
      );
    } catch (error) {
      this.logger.error('❌ Failed to initialize blockchain service', error);
      throw error;
    }
  }

  // ============= READ FUNCTIONS (No gas cost) =============

  async getProject(projectId: number): Promise<Project> {
    try {
      const project = await this.contract.projects(projectId);
      const metadata = await this.contract.projectMetadata(projectId);

      return {
        id: projectId,
        name: project[0] as string,
        location: project[1] as string,
        installationSizeKw: Number(project[2]),
        estimatedAnnualKwh: Number(project[3]),
        totalShares: Number(project[4]),
        sharesSold: Number(project[5]),
        pricePerShare: ethers.formatEther(project[6]),
        projectStartDate: Number(project[7]),
        status: Number(project[8]),
        projectWallet: project[9] as string,
        transfersEnabled: project[10] as boolean,
        projectType: metadata[0] as string,
        projectSubtype: metadata[1] as string,
        documentIPFS: metadata[2] as string,
        projectDuration: Number(metadata[3]),
      };
    } catch (error) {
      this.logger.error(`Failed to get project ${projectId}`, error);
      throw error;
    }
  }

  async getAllProjects(): Promise<Project[]> {
    try {
      const nextProjectId = await this.contract.nextProjectId();
      const projects: Project[] = [];

      for (let i = 1; i < Number(nextProjectId); i++) {
        try {
          const project = await this.getProject(i);
          projects.push(project);
        } catch (error) {
          this.logger.warn(`Project ${i} not found or invalid`);
        }
      }

      return projects;
    } catch (error) {
      this.logger.error('Failed to get all projects', error);
      throw error;
    }
  }

  async getInvestorPosition(
    projectId: number,
    investorAddress: string,
  ): Promise<InvestorPosition> {
    try {
      const position = await this.contract.getInvestorPosition(
        projectId,
        investorAddress,
      );

      return {
        shares: Number(position[0]),
        totalInvested: ethers.formatEther(position[1]),
        lifetimeKwh: Number(position[2]),
        claimableKwh: Number(position[3]),
        estimatedAnnualKwh: Number(position[4]),
      };
    } catch (error) {
      this.logger.error(`Failed to get investor position`, error);
      throw error;
    }
  }

  async getUserPortfolio(userAddress: string): Promise<PortfolioItem[]> {
    try {
      const projects = await this.getAllProjects();
      const portfolio: PortfolioItem[] = [];

      for (const project of projects) {
        const balance = await this.contract.balanceOf(userAddress, project.id);

        if (Number(balance) > 0) {
          const position = await this.getInvestorPosition(
            project.id,
            userAddress,
          );
          portfolio.push({
            project,
            position,
            sharesOwned: Number(balance),
          });
        }
      }

      return portfolio;
    } catch (error) {
      this.logger.error('Failed to get user portfolio', error);
      throw error;
    }
  }

  async getClaimableCredits(
    projectId: number,
    userAddress: string,
  ): Promise<number> {
    try {
      const credits = await this.contract.getClaimableCredits(
        projectId,
        userAddress,
      );
      return Number(credits);
    } catch (error) {
      this.logger.error('Failed to get claimable credits', error);
      throw error;
    }
  }

  async getProjectStats(projectId: number): Promise<ProjectStats> {
    try {
      const stats = await this.contract.getProjectStats(projectId);

      return {
        totalProduction: Number(stats[0]),
        recordCount: Number(stats[1]),
        averageDaily: Number(stats[2]),
        lastRecordedTimestamp: Number(stats[3]),
      };
    } catch (error) {
      this.logger.error(`Failed to get project stats for ${projectId}`, error);
      throw error;
    }
  }

  async getProductionHistory(
    projectId: number,
    limit: number = 100,
  ): Promise<ProductionRecord[]> {
    try {
      // Note: This requires iterating through production records
      // In production, consider caching this in a database
      const stats = await this.getProjectStats(projectId);
      const recordCount = stats.recordCount;
      const history: ProductionRecord[] = [];

      const startIndex = Math.max(0, recordCount - limit);

      for (let i = startIndex; i < recordCount; i++) {
        try {
          const record = await this.contract.productionHistory(projectId, i);
          history.push({
            timestamp: Number(record[0]),
            kwhProduced: Number(record[1]),
            cumulativeKwh: Number(record[2]),
            dataSource: record[3] as string,
          });
        } catch (error) {
          this.logger.warn(`Could not fetch production record ${i}`);
        }
      }

      return history;
    } catch (error) {
      this.logger.error('Failed to get production history', error);
      throw error;
    }
  }

  // ============= WRITE FUNCTIONS (Require gas) =============

  async createProject(params: ProjectParams): Promise<TransactionResult> {
    try {
      this.logger.log(`Creating project: ${params.name}`);

      const projectParams = {
        name: params.name,
        location: params.location,
        projectType: params.projectType,
        projectSubtype: params.projectSubtype,
        installationSizeKw: params.installationSizeKw,
        estimatedAnnualKwh: params.estimatedAnnualKwh,
        totalShares: params.totalShares,
        pricePerShare: ethers.parseEther(params.pricePerShare),
        projectDuration: params.projectDuration,
        projectWallet: params.projectWallet,
        documentIPFS: params.documentIPFS,
      };

      const tx = await this.contract.createProject(projectParams);
      this.logger.log(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(
        `✅ Project created! Gas used: ${receipt.gasUsed.toString()}`,
      );

      // Extract project ID from event
      const event = receipt.logs.find((log: ethers.Log) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === 'ProjectCreated';
        } catch {
          return false;
        }
      });

      let projectId: number | undefined;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        if (parsed) {
          projectId = Number(parsed.args[0]);
          this.logger.log(`Project ID: ${projectId}`);
        }
      }

      return {
        success: true,
        projectId,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      this.logger.error('Failed to create project', error);
      throw error;
    }
  }

  async recordProduction(
    projectId: number,
    kwhProduced: number,
    dataSource: string,
  ): Promise<TransactionResult> {
    try {
      this.logger.log(`Recording ${kwhProduced} kWh for project ${projectId}`);

      const contractWithOracle = this.contract.connect(
        this.oracleWallet,
      ) as any;
      const tx = await contractWithOracle.recordProduction(
        projectId,
        kwhProduced,
        dataSource,
      );

      const receipt = await tx.wait();
      this.logger.log(
        `✅ Production recorded! Gas used: ${receipt.gasUsed.toString()}`,
      );

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      this.logger.error('Failed to record production', error);
      throw error;
    }
  }

  async updateProjectStatus(
    projectId: number,
    newStatus: number,
  ): Promise<TransactionResult> {
    try {
      const tx = await this.contract.updateProjectStatus(projectId, newStatus);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      this.logger.error('Failed to update project status', error);
      throw error;
    }
  }

  // ============= EVENT LISTENERS =============

  onProjectCreated(callback: (event: ProjectCreatedEvent) => void): void {
    this.contract.on(
      'ProjectCreated',
      (
        projectId: bigint,
        name: string,
        shares: bigint,
        price: bigint,
        event: ethers.Log,
      ) => {
        callback({
          projectId: Number(projectId),
          name,
          totalShares: Number(shares),
          pricePerShare: ethers.formatEther(price),
          transactionHash: event.transactionHash,
        });
      },
    );
  }

  onSharesPurchased(callback: (event: SharesPurchasedEvent) => void): void {
    this.contract.on(
      'SharesPurchased',
      (
        projectId: bigint,
        investor: string,
        shares: bigint,
        totalCost: bigint,
        event: ethers.Log,
      ) => {
        callback({
          projectId: Number(projectId),
          investor,
          shares: Number(shares),
          totalCost: ethers.formatEther(totalCost),
          transactionHash: event.transactionHash,
        });
      },
    );
  }

  onProductionRecorded(
    callback: (event: ProductionRecordedEvent) => void,
  ): void {
    this.contract.on(
      'ProductionRecorded',
      (
        projectId: bigint,
        kwhProduced: bigint,
        timestamp: bigint,
        dataSource: string,
        event: ethers.Log,
      ) => {
        callback({
          projectId: Number(projectId),
          kwhProduced: Number(kwhProduced),
          timestamp: Number(timestamp),
          dataSource,
          transactionHash: event.transactionHash,
        });
      },
    );
  }

  // ============= UTILITY FUNCTIONS =============

  async getGasPrice(): Promise<string> {
    const feeData = await this.provider.getFeeData();
    return ethers.formatUnits(feeData.gasPrice || 0, 'gwei');
  }

  async getWalletBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async estimateGas(method: string, ...args: unknown[]): Promise<string> {
    try {
      const gasEstimate = await this.contract[method].estimateGas(...args);
      return gasEstimate.toString();
    } catch (error) {
      this.logger.error('Failed to estimate gas', error);
      throw error;
    }
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  getContract(): ethers.Contract {
    return this.contract;
  }
}
