import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { BlockchainService } from '../blockchain/blockchain.service';
import { WalletService } from '../shared/services/wallet.service';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionDocument,
} from './schemas/transaction.schema';
import { User } from '../user/schemas/user.schema';
import { PurchaseSharesDto } from './dto/purchase-shares.dto';

export interface PurchaseEstimate {
  projectId: number;
  projectName: string;
  shares: number;
  pricePerShare: string; // in DIONE
  pricePerShareUSD: number;
  totalCostDIONE: string;
  totalCostUSD: number;
  platformFee: string; // in DIONE
  platformFeeUSD: number;
  estimatedGasFee: string; // in DIONE
  estimatedGasFeeUSD: number;
  totalWithFees: string; // in DIONE
  totalWithFeesUSD: number;
  availableShares: number;
  userBalance: string; // User's DIONE balance
  userBalanceUSD: number;
  sufficientBalance: boolean;
}

export interface PurchaseResult {
  success: boolean;
  transactionId: string;
  transactionHash: string;
  projectId: number;
  shares: number;
  totalCost: string;
  platformFee: string;
  gasFee: string;
  message: string;
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  private readonly platformFeePercent = 250; // 2.5% (basis points)
  private readonly dioneUsdPrice = 0.002; // $0.002 per DIONE (update with real price feed)

  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<Transaction>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    private blockchainService: BlockchainService,
    private walletService: WalletService,
    private configService: ConfigService,
  ) {}

  /**
   * Get purchase estimate with all costs
   */
  async estimatePurchase(
    userId: string,
    projectId: number,
    shares: number,
  ): Promise<PurchaseEstimate> {
    try {
      // Get user
      const user = await this.userModel.findById(userId);
      if (!user || !user.walletAddress) {
        throw new NotFoundException('User wallet not found');
      }

      // Get project details
      const project = await this.blockchainService.getProject(projectId);
      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Check available shares
      const availableShares = project.totalShares - project.sharesSold;
      if (shares > availableShares) {
        throw new BadRequestException(
          `Only ${availableShares} shares available`,
        );
      }

      // Calculate costs
      const pricePerShareBN = ethers.parseEther(project.pricePerShare);
      const totalCostBN = pricePerShareBN * BigInt(shares);
      const platformFeeBN =
        (totalCostBN * BigInt(this.platformFeePercent)) / BigInt(10000);

      // Estimate gas fee
      const estimatedGasBN = ethers.parseEther('0.001'); // Conservative estimate

      const totalWithFeesBN = totalCostBN + estimatedGasBN;

      // Get user balance
      const balanceBN = await this.blockchainService.getBalance(
        user.walletAddress,
      );

      // Convert to USD
      const totalCostUSD =
        parseFloat(ethers.formatEther(totalCostBN)) * this.dioneUsdPrice;
      const platformFeeUSD =
        parseFloat(ethers.formatEther(platformFeeBN)) * this.dioneUsdPrice;
      const estimatedGasFeeUSD =
        parseFloat(ethers.formatEther(estimatedGasBN)) * this.dioneUsdPrice;
      const totalWithFeesUSD =
        parseFloat(ethers.formatEther(totalWithFeesBN)) * this.dioneUsdPrice;
      const userBalanceUSD =
        parseFloat(ethers.formatEther(balanceBN)) * this.dioneUsdPrice;

      return {
        projectId,
        projectName: project.name,
        shares,
        pricePerShare: project.pricePerShare,
        pricePerShareUSD:
          parseFloat(project.pricePerShare) * this.dioneUsdPrice,
        totalCostDIONE: ethers.formatEther(totalCostBN),
        totalCostUSD,
        platformFee: ethers.formatEther(platformFeeBN),
        platformFeeUSD,
        estimatedGasFee: ethers.formatEther(estimatedGasBN),
        estimatedGasFeeUSD,
        totalWithFees: ethers.formatEther(totalWithFeesBN),
        totalWithFeesUSD,
        availableShares,
        userBalance: ethers.formatEther(balanceBN),
        userBalanceUSD,
        sufficientBalance: balanceBN >= totalWithFeesBN,
      };
    } catch (error) {
      this.logger.error('Failed to estimate purchase', error);
      throw error;
    }
  }

  /**
   * Purchase shares in a project (main function)
   */
  async purchaseShares(
    userId: string,
    dto: PurchaseSharesDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<PurchaseResult> {
    let transactionRecord: TransactionDocument | null = null;

    try {
      // 1. Get and verify user
      const user = await this.userModel.findById(userId);
      if (!user || !user.walletAddress || !user.encryptedWallet) {
        throw new NotFoundException('User wallet not configured');
      }

      // 2. Verify password
      const isPasswordValid = await this.walletService.verifyPassword(
        user.encryptedWallet,
        dto.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      // 3. Get purchase estimate
      const estimate = await this.estimatePurchase(
        userId,
        dto.projectId,
        dto.shares,
      );

      if (!estimate.sufficientBalance) {
        throw new BadRequestException(
          `Insufficient balance. Need ${estimate.totalWithFees} DIONE, have ${estimate.userBalance} DIONE`,
        );
      }

      // 4. Create transaction record (PENDING)
      transactionRecord = await this.transactionModel.create({
        userId,
        walletAddress: user.walletAddress,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.PENDING,
        projectId: dto.projectId,
        projectName: estimate.projectName,
        shares: dto.shares,
        amountDIONE: estimate.totalCostDIONE,
        amountUSD: estimate.totalCostUSD,
        pricePerShare: estimate.pricePerShare,
        platformFee: estimate.platformFee,
        gasFee: estimate.estimatedGasFee,
        ipAddress,
        userAgent,
        confirmations: 0,
        metadata: {
          estimatedGas: estimate.estimatedGasFee,
          userBalance: estimate.userBalance,
        },
      });

      this.logger.log(
        `Starting purchase: User ${userId}, Project ${dto.projectId}, Shares ${dto.shares}`,
      );

      // 5. Get wallet instance
      const provider = this.blockchainService.getProvider();
      const wallet = await this.walletService.getWalletInstance(
        user.encryptedWallet,
        dto.password,
        provider,
      );

      // 6. Prepare transaction
      const project = await this.blockchainService.getProject(dto.projectId);
      const totalCost = ethers.parseEther(estimate.totalCostDIONE);

      const contract = this.blockchainService.getContractWithSigner(wallet);

      // 7. Send transaction
      this.logger.log(`Sending blockchain transaction...`);
      const tx = await contract.purchaseShares(dto.projectId, dto.shares, {
        value: totalCost,
        gasLimit: 300000n, // Conservative gas limit
      });

      // 8. Update transaction record (CONFIRMING)
      transactionRecord.status = TransactionStatus.CONFIRMING;
      transactionRecord.transactionHash = tx.hash;
      await transactionRecord.save();

      this.logger.log(`Transaction sent: ${tx.hash}`);

      // 9. Wait for confirmation (async - don't block response)
      this.waitForConfirmation(transactionRecord._id.toString(), tx.hash);

      return {
        success: true,
        transactionId: transactionRecord._id.toString(),
        transactionHash: tx.hash,
        projectId: dto.projectId,
        shares: dto.shares,
        totalCost: estimate.totalCostDIONE,
        platformFee: estimate.platformFee,
        gasFee: estimate.estimatedGasFee,
        message: 'Purchase transaction submitted successfully',
      };
    } catch (error) {
      this.logger.error('Purchase failed', error);

      // Update transaction record if created
      if (transactionRecord) {
        transactionRecord.status = TransactionStatus.FAILED;
        transactionRecord.errorMessage = error.message;
        await transactionRecord.save();
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Purchase failed: ${error.message}`,
      );
    }
  }

  /**
   * Wait for transaction confirmation (background process)
   */
  private async waitForConfirmation(
    transactionId: string,
    txHash: string,
  ): Promise<void> {
    try {
      const provider = this.blockchainService.getProvider();
      
      // Wait for 3 confirmations
      this.logger.log(`Waiting for confirmation: ${txHash}`);
      const receipt = await provider.waitForTransaction(txHash, 3);

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      // Update transaction record
      const transaction = await this.transactionModel.findById(transactionId);
      if (!transaction) {
        this.logger.error(`Transaction record not found: ${transactionId}`);
        return;
      }

      if (receipt.status === 1) {
        // Success
        transaction.status = TransactionStatus.CONFIRMED;
        transaction.blockNumber = receipt.blockNumber;
        transaction.confirmations = 3;
        transaction.gasFee = ethers.formatEther(
          receipt.gasUsed * receipt.gasPrice,
        );
        
        this.logger.log(`Transaction confirmed: ${txHash}`);
      } else {
        // Failed
        transaction.status = TransactionStatus.FAILED;
        transaction.errorMessage = 'Transaction reverted on blockchain';
        
        this.logger.error(`Transaction reverted: ${txHash}`);
      }

      await transaction.save();
    } catch (error) {
      this.logger.error(`Failed to confirm transaction ${txHash}`, error);
      
      // Mark as failed
      await this.transactionModel.findByIdAndUpdate(transactionId, {
        status: TransactionStatus.FAILED,
        errorMessage: `Confirmation failed: ${error.message}`,
      });
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(userId: string, transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionModel.findOne({
      _id: transactionId,
      userId,
      deletedAt: null,
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Get user transaction history
   */
  async getUserTransactions(
    userId: string,
    limit: number = 50,
    skip: number = 0,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find({ userId, deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec(),
      this.transactionModel.countDocuments({ userId, deletedAt: null }),
    ]);

    return { transactions, total };
  }

  /**
   * Get project transactions
   */
  async getProjectTransactions(
    projectId: number,
    limit: number = 50,
  ): Promise<Transaction[]> {
    return this.transactionModel
      .find({
        projectId,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.CONFIRMED,
        deletedAt: null,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
