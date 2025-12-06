import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { BlockchainService, TransactionResult } from '../blockchain.service';
import { ethers } from 'ethers';

@Injectable()
export class OracleService implements OnModuleInit {
  private readonly logger = new Logger(OracleService.name);
  private oracleWallet: ethers.Wallet | null = null;
  private simulationMode: boolean = false;
  private simulatedProductionData: Map<number, number[]> = new Map();

  constructor(
    private blockchainService: BlockchainService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      const oracleMode = this.configService.get<string>('ORACLE_MODE', 'real');

      if (oracleMode === 'simulation') {
        this.simulationMode = true;
        this.logger.warn('🧪 ═══════════════════════════════════════════════');
        this.logger.warn('🧪 ORACLE RUNNING IN SIMULATION MODE');
        this.logger.warn('🧪 No blockchain writes - Data stored in memory');
        this.logger.warn('🧪 Perfect for development/testing');
        this.logger.warn('🧪 Set ORACLE_MODE=real for production');
        this.logger.warn('🧪 ═══════════════════════════════════════════════');
        return;
      }

      if (this.blockchainService.isOracleAvailable()) {
        this.oracleWallet = this.blockchainService.getOracleWallet();
        const balance = await this.blockchainService.getWalletBalance(
          this.oracleWallet.address,
        );
        this.logger.log('✅ ═══════════════════════════════════════════════');
        this.logger.log('✅ ORACLE SERVICE INITIALIZED (REAL MODE)');
        this.logger.log(`✅ Oracle Address: ${this.oracleWallet.address}`);
        this.logger.log(`✅ Balance: ${balance} DIONE`);
        this.logger.log('✅ Ready to record production on blockchain');
        this.logger.log('✅ ═══════════════════════════════════════════════');
      } else {
        this.logger.warn('⚠️  ═══════════════════════════════════════════════');
        this.logger.warn('⚠️  Oracle service disabled');
        this.logger.warn('⚠️  ORACLE_PRIVATE_KEY not configured');
        this.logger.warn('⚠️  ');
        this.logger.warn('⚠️  Options:');
        this.logger.warn('⚠️  1. Set ORACLE_MODE=simulation for testing');
        this.logger.warn('⚠️  2. Generate oracle wallet for production');
        this.logger.warn('⚠️  ═══════════════════════════════════════════════');
      }
    } catch (error) {
      this.logger.error('❌ Failed to initialize oracle service', error);
    }
  }

  /**
   * Record production on blockchain (oracle-only operation)
   */
  async recordProduction(
    projectId: number,
    kwhProduced: number,
    dataSource: string,
  ): Promise<TransactionResult> {
    // SIMULATION MODE - Store in memory
    if (this.simulationMode) {
      this.logger.log(
        `🧪 [SIMULATION] Recording ${kwhProduced} kWh for project ${projectId} (Source: ${dataSource})`,
      );

      // Store in memory for later retrieval
      if (!this.simulatedProductionData.has(projectId)) {
        this.simulatedProductionData.set(projectId, []);
      }
      this.simulatedProductionData.get(projectId)!.push(kwhProduced);

      // Return simulated transaction result
      const simulatedTxHash = `0xSIMULATED${Date.now()}${projectId}`;
      this.logger.log(
        `✅ [SIMULATION] Production stored in memory. Simulated Tx: ${simulatedTxHash}`,
      );

      return {
        success: true,
        transactionHash: simulatedTxHash,
        gasUsed: '0',
      };
    }

    // REAL MODE - Submit to blockchain
    if (!this.oracleWallet) {
      throw new Error(
        'Oracle not configured. Set ORACLE_PRIVATE_KEY or use ORACLE_MODE=simulation',
      );
    }

    try {
      this.logger.log(`Recording ${kwhProduced} kWh for project ${projectId}`);

      const contract = this.blockchainService.getContract();
      const contractWithOracle = contract.connect(this.oracleWallet) as any;

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

  /**
   * Simulate production based on time of day and energy type
   * In production, this would call real APIs (Enphase, SolarEdge, etc.)
   */
  private calculateSimulatedProduction(
    hour: number,
    projectType: string,
  ): number {
    if (projectType === 'Solar') {
      // Solar peaks at noon (12:00)
      const peakHour = 12;
      const maxProduction = 500;

      // No production at night
      if (hour < 6 || hour > 18) return 0;

      // Bell curve for solar production
      const hoursFromPeak = Math.abs(hour - peakHour);
      const production =
        maxProduction * Math.exp(-0.1 * hoursFromPeak * hoursFromPeak);

      return Math.floor(production);
    }

    if (projectType === 'Wind') {
      // Wind is more consistent but varies
      // Higher in morning and evening
      if ((hour >= 6 && hour <= 10) || (hour >= 18 && hour <= 22)) {
        return Math.floor(Math.random() * 200 + 300); // 300-500 kWh
      }
      return Math.floor(Math.random() * 150 + 150); // 150-300 kWh
    }

    if (projectType === 'Hydro') {
      // Hydro is most consistent
      return Math.floor(Math.random() * 100 + 400); // 400-500 kWh
    }

    if (projectType === 'Geothermal') {
      // Geothermal is extremely consistent (baseload)
      return Math.floor(Math.random() * 50 + 450); // 450-500 kWh
    }

    return 0;
  }

  /**
   * Run every hour to record production for all active projects
   * Schedule: At minute 0 of every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async recordHourlyProduction() {
    try {
      this.logger.log('🔄 Running hourly production recording...');

      const projects = await this.blockchainService.getAllProjects();
      const currentHour = new Date().getHours();

      let successCount = 0;
      let failCount = 0;

      for (const project of projects) {
        // Only record for active projects (status = 1)
        if (project.status !== 1) {
          this.logger.debug(
            `Skipping project ${project.id} (status: ${project.status})`,
          );
          continue;
        }

        try {
          const production = this.calculateSimulatedProduction(
            currentHour,
            project.projectType,
          );

          if (production > 0) {
            await this.recordProduction(
              project.id,
              production,
              'Oracle Simulator',
            );

            this.logger.log(
              `✅ Project ${project.id} (${project.name}): ${production} kWh recorded`,
            );
            successCount++;
          } else {
            this.logger.debug(
              `Project ${project.id}: No production at this hour`,
            );
          }
        } catch (error) {
          this.logger.error(
            `❌ Failed to record production for project ${project.id}`,
            error,
          );
          failCount++;
        }
      }

      this.logger.log(
        `📊 Hourly recording complete: ${successCount} success, ${failCount} failed`,
      );
    } catch (error) {
      this.logger.error('❌ Failed to run hourly production recording', error);
    }
  }

  /**
   * Manual production recording (for testing or API integration)
   */
  async recordProductionManually(
    projectId: number,
    kwhProduced: number,
    source: string,
  ): Promise<TransactionResult> {
    try {
      this.logger.log(
        `Manual recording: ${kwhProduced} kWh for project ${projectId}`,
      );
      return await this.recordProduction(projectId, kwhProduced, source);
    } catch (error) {
      this.logger.error('Failed to manually record production', error);
      throw error;
    }
  }

  /**
   * Get simulated production for a specific project at current time
   * Useful for testing/preview
   */
  async getSimulatedProduction(projectId: number): Promise<number> {
    try {
      const project = await this.blockchainService.getProject(projectId);
      const currentHour = new Date().getHours();
      return this.calculateSimulatedProduction(
        currentHour,
        project.projectType,
      );
    } catch (error) {
      this.logger.error('Failed to get simulated production', error);
      throw error;
    }
  }

  /**
   * Test the oracle by recording production once immediately
   */
  async testOracle() {
    const modeLabel = this.simulationMode ? '🧪 [SIMULATION]' : '📊 [REAL]';
    this.logger.log('═══════════════════════════════════════════════════');
    this.logger.log(`${modeLabel} ORACLE TEST MODE - Recording NOW`);
    this.logger.log('═══════════════════════════════════════════════════');
    await this.recordHourlyProduction();
  }

  /**
   * Get simulated production history (simulation mode only)
   */
  getSimulatedProductionHistory(projectId: number): number[] {
    if (!this.simulationMode) {
      this.logger.warn('Not in simulation mode - no simulated data available');
      return [];
    }
    return this.simulatedProductionData.get(projectId) || [];
  }

  /**
   * Get total simulated production (simulation mode only)
   */
  getTotalSimulatedProduction(projectId: number): number {
    const history = this.getSimulatedProductionHistory(projectId);
    return history.reduce((sum, val) => sum + val, 0);
  }

  /**
   * Check if oracle is in simulation mode
   */
  isSimulationMode(): boolean {
    return this.simulationMode;
  }

  /**
   * Get oracle status and configuration
   */
  async getOracleStatus() {
    const status = {
      mode: this.simulationMode ? 'simulation' : 'real',
      active: this.simulationMode || this.oracleWallet !== null,
      address: this.oracleWallet?.address || null,
      balance: null as string | null,
      simulatedProjects: this.simulationMode
        ? Array.from(this.simulatedProductionData.keys())
        : [],
    };

    if (this.oracleWallet && !this.simulationMode) {
      try {
        status.balance = await this.blockchainService.getWalletBalance(
          this.oracleWallet.address,
        );
      } catch (error) {
        this.logger.error('Failed to get oracle wallet balance', error);
      }
    }

    return status;
  }
}
