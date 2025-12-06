import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, unique: true })
  projectId: number; // On-chain project ID

  // On-chain data (cached)
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  installationSizeKw: number;

  @Prop({ required: true })
  estimatedAnnualKwh: number;

  @Prop({ required: true })
  totalShares: number;

  @Prop({ required: true, default: 0 })
  sharesSold: number;

  @Prop({ required: true })
  pricePerShare: string; // In DIONE

  @Prop({ required: true })
  projectStartDate: number; // Unix timestamp

  @Prop({ required: true, enum: [0, 1, 2, 3], default: 0 })
  status: number; // 0: Pending, 1: Active, 2: Completed, 3: Suspended

  @Prop({ required: true })
  projectWallet: string;

  @Prop({ default: false })
  transfersEnabled: boolean;

  // Metadata (on-chain)
  @Prop({ required: true })
  projectType: string; // Solar, Wind, Hydro, Geothermal

  @Prop({ required: true })
  projectSubtype: string;

  @Prop()
  documentIPFS: string;

  @Prop({ required: true })
  projectDuration: number; // In seconds

  // Off-chain metadata (rich content)
  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  images: string[]; // Array of image URLs or IPFS hashes

  @Prop()
  detailedSpecifications: string;

  @Prop({ type: Object })
  equipmentDetails: {
    manufacturer?: string;
    model?: string;
    warrantyYears?: number;
    efficiency?: number;
  };

  @Prop({ type: Object })
  financialProjections: {
    estimatedROI?: number;
    paybackPeriod?: number;
    expectedAnnualRevenue?: string;
  };

  // Production tracking (cached from blockchain)
  @Prop({ default: 0 })
  totalProduction: number; // Total kWh produced

  @Prop({ default: 0 })
  productionRecordCount: number;

  @Prop()
  lastProductionUpdate: Date;

  // Cache metadata
  @Prop({ required: true, default: Date.now })
  lastSyncedAt: Date;

  @Prop({ default: true })
  isCacheValid: boolean;

  // Soft delete
  @Prop({ default: null })
  deletedAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Indexes for performance
ProjectSchema.index({ projectId: 1 }); // Primary lookup
ProjectSchema.index({ status: 1, projectType: 1 }); // Filtering
ProjectSchema.index({ location: 'text', name: 'text', description: 'text' }); // Full-text search
ProjectSchema.index({ deletedAt: 1 }); // Soft delete queries
