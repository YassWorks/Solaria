import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Investor, InvestorDocument, PortfolioProject } from './schemas/investor.schema';
import { BlockchainService } from '../blockchain/blockchain.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface InvestorAnalytics {
  totalInvested: string;
  currentValue: string;
  totalROI: number;
  annualizedReturn: number;
  totalEnergyCredits: number;
  totalCO2Offset: number;
  projectCount: number;
  daysInvested: number;
}

@Injectable()
export class InvestorsService {
  private readonly logger = new Logger(InvestorsService.name);
  private readonly CACHE_TTL_SECONDS = 300; // 5 minutes

  constructor(
    @InjectModel(Investor.name) private investorModel: Model<InvestorDocument>,
    private blockchainService: BlockchainService,
  ) {}

  /**
   * Get investor portfolio with caching
   */
  async getInvestorPortfolio(
    walletAddress: string,
    forceRefresh = false,
  ): Promise<Investor> {
    const normalizedAddress = walletAddress.toLowerCase();

    // Try cache first
    if (!forceRefresh) {
      const cached = await this.investorModel.findOne({
        walletAddress: normalizedAddress,
        deletedAt: null,
      });

      if (cached && this.isCacheValid(cached.lastSyncedAt)) {
        this.logger.debug(`Cache hit for investor ${walletAddress}`);
        return cached;
      }
    }

    // Fetch from blockchain
    this.logger.log(`Fetching portfolio for ${walletAddress} from blockchain`);
    const portfolioData = await this.blockchainService.getUserPortfolio(
      walletAddress,
    );

    // Calculate summary metrics
    let totalInvested = 0;
    let totalEnergyCredits = 0;
    const portfolio: PortfolioProject[] = [];

    for (const item of portfolioData) {
      const position = await this.blockchainService.getInvestorPosition(
        item.project.id,
        walletAddress,
      );

      const claimableCredits = await this.blockchainService.getClaimableCredits(
        item.project.id,
        walletAddress,
      );

      totalInvested += parseFloat(position.totalInvested);
      totalEnergyCredits += position.lifetimeKwh;

      portfolio.push({
        projectId: item.project.id,
        projectName: item.project.name,
        shares: position.shares,
        totalInvested: position.totalInvested,
        purchaseDate: new Date(), // TODO: Get from events
        lifetimeKwhEarned: position.lifetimeKwh,
        lifetimeCreditsIssued: 0, // TODO: Calculate
        claimableKwh: claimableCredits,
        currentValue: position.totalInvested, // TODO: Calculate with current price
      });
    }

    // Calculate CO2 offset (0.85 lbs per kWh = 0.000385 metric tons)
    const totalCO2Offset = totalEnergyCredits * 0.000385;

    // Update or create investor record
    const updated = await this.investorModel.findOneAndUpdate(
      { walletAddress: normalizedAddress },
      {
        walletAddress: normalizedAddress,
        portfolio,
        totalInvestedDIONE: totalInvested,
        totalEnergyCreditsEarned: totalEnergyCredits,
        totalCO2Offset,
        lastActivityDate: new Date(),
        lastSyncedAt: new Date(),
        isCacheValid: true,
      },
      { upsert: true, new: true },
    );

    return updated;
  }

  /**
   * Get investor analytics
   */
  async getInvestorAnalytics(walletAddress: string): Promise<InvestorAnalytics> {
    const investor = await this.getInvestorPortfolio(walletAddress);

    const currentValue = investor.portfolio.reduce(
      (sum, p) => sum + parseFloat(p.currentValue || '0'),
      0,
    );

    const totalInvested = investor.portfolio.reduce(
      (sum, p) => sum + parseFloat(p.totalInvested),
      0,
    );

    const totalROI =
      totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

    const daysInvested = investor.firstInvestmentDate
      ? Math.floor(
          (Date.now() - investor.firstInvestmentDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    const annualizedReturn =
      daysInvested > 0 ? (totalROI / daysInvested) * 365 : 0;

    return {
      totalInvested: totalInvested.toFixed(4),
      currentValue: currentValue.toFixed(4),
      totalROI,
      annualizedReturn,
      totalEnergyCredits: investor.totalEnergyCreditsEarned,
      totalCO2Offset: investor.totalCO2Offset,
      projectCount: investor.portfolio.length,
      daysInvested,
    };
  }

  /**
   * Get investor position in specific project
   */
  async getProjectPosition(walletAddress: string, projectId: number): Promise<any> {
    const position = await this.blockchainService.getInvestorPosition(
      projectId,
      walletAddress,
    );

    const claimableCredits = await this.blockchainService.getClaimableCredits(
      projectId,
      walletAddress,
    );

    return {
      ...position,
      claimableKwh: claimableCredits,
    };
  }

  /**
   * Link investor wallet to user account
   */
  async linkWalletToUser(walletAddress: string, userId: string): Promise<Investor> {
    const normalizedAddress = walletAddress.toLowerCase();

    const updated = await this.investorModel.findOneAndUpdate(
      { walletAddress: normalizedAddress },
      { userId, walletAddress: normalizedAddress },
      { upsert: true, new: true },
    );

    return updated;
  }

  /**
   * Get top investors (leaderboard)
   */
  async getTopInvestors(limit = 10): Promise<Investor[]> {
    return this.investorModel
      .find({ deletedAt: null })
      .sort({ totalInvestedUSD: -1 })
      .limit(limit);
  }

  /**
   * Sync investor data from blockchain
   */
  async syncInvestor(walletAddress: string): Promise<Investor> {
    return this.getInvestorPortfolio(walletAddress, true);
  }

  /**
   * Cron job: Sync top investors every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledInvestorSync() {
    this.logger.log('Running scheduled investor sync...');
    try {
      const topInvestors = await this.investorModel
        .find({ deletedAt: null })
        .sort({ lastActivityDate: -1 })
        .limit(50);

      for (const investor of topInvestors) {
        try {
          await this.syncInvestor(investor.walletAddress);
        } catch (error) {
          this.logger.error(
            `Failed to sync investor ${investor.walletAddress}`,
            error,
          );
        }
      }

      this.logger.log(`Synced ${topInvestors.length} investors`);
    } catch (error) {
      this.logger.error('Scheduled investor sync failed', error);
    }
  }

  /**
   * Helper: Check if cache is still valid
   */
  private isCacheValid(lastSyncedAt: Date): boolean {
    const now = new Date();
    const diffSeconds = (now.getTime() - lastSyncedAt.getTime()) / 1000;
    return diffSeconds < this.CACHE_TTL_SECONDS;
  }
}
