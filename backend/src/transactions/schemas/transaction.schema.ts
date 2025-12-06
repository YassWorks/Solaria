import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  CLAIM_CREDITS = 'CLAIM_CREDITS',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMING = 'CONFIRMING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true, enum: Object.values(TransactionType) })
  type: TransactionType;

  @Prop({ required: true, enum: Object.values(TransactionStatus) })
  status: TransactionStatus;

  @Prop({ required: true })
  projectId: number;

  @Prop()
  projectName: string;

  @Prop()
  shares: number;

  @Prop()
  amountDIONE: string; // Amount in DIONE (wei)

  @Prop()
  amountUSD: number; // Estimated USD value at time of transaction

  @Prop()
  pricePerShare: string; // Price per share in wei

  @Prop()
  platformFee: string; // Platform fee in wei

  @Prop()
  gasFee: string; // Gas fee paid in wei

  @Prop()
  transactionHash: string;

  @Prop()
  blockNumber: number;

  @Prop()
  confirmations: number;

  @Prop()
  errorMessage: string;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes for efficient queries
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ walletAddress: 1, createdAt: -1 });
TransactionSchema.index({ projectId: 1, createdAt: -1 });
TransactionSchema.index({ transactionHash: 1 }, { unique: true, sparse: true });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ deletedAt: 1 });
