import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InvestorDocument = Investor & Document;

export interface PortfolioProject {
  projectId: number;
  projectName: string;
  shares: number;
  totalInvested: string; // In DIONE
  purchaseDate: Date;
  lifetimeKwhEarned: number;
  lifetimeCreditsIssued: number;
  claimableKwh: number;
  currentValue: string; // Calculated
}

@Schema({ timestamps: true })
export class Investor {
  @Prop({ required: true, unique: true, lowercase: true })
  walletAddress: string;

  @Prop()
  userId: string; // Reference to User collection if linked

  // Portfolio summary (cached from blockchain)
  @Prop({ type: [Object], default: [] })
  portfolio: PortfolioProject[];

  @Prop({ default: 0 })
  totalInvestedDIONE: number;

  @Prop({ default: 0 })
  totalInvestedUSD: number;

  @Prop({ default: 0 })
  portfolioValueDIONE: number;

  @Prop({ default: 0 })
  portfolioValueUSD: number;

  @Prop({ default: 0 })
  totalEnergyCreditsEarned: number; // kWh

  @Prop({ default: 0 })
  totalCO2Offset: number; // metric tons

  // Analytics
  @Prop({ default: 0 })
  totalROI: number; // Percentage

  @Prop({ default: 0 })
  annualizedReturn: number; // Percentage

  @Prop()
  firstInvestmentDate: Date;

  @Prop()
  lastActivityDate: Date;

  // Cache metadata
  @Prop({ required: true, default: Date.now })
  lastSyncedAt: Date;

  @Prop({ default: true })
  isCacheValid: boolean;

  // Soft delete
  @Prop({ default: null })
  deletedAt: Date;
}

export const InvestorSchema = SchemaFactory.createForClass(Investor);

// Indexes
InvestorSchema.index({ walletAddress: 1 }); // Primary lookup
InvestorSchema.index({ userId: 1 }); // User linkage
InvestorSchema.index({ totalInvestedUSD: -1 }); // Leaderboard
InvestorSchema.index({ deletedAt: 1 }); // Soft delete
