import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { BlockchainService } from '../blockchain/blockchain.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface ProjectFilter {
  status?: number;
  projectType?: string;
  location?: string;
  search?: string;
  minROI?: number;
  maxPrice?: string;
}

export interface ProjectWithAnalytics extends Project {
  analytics: {
    averageDailyProduction: number;
    capacityFactor: number;
    performanceRatio: number;
    daysActive: number;
  };
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private readonly CACHE_TTL_SECONDS = 300; // 5 minutes

  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private blockchainService: BlockchainService,
  ) {}

  /**
   * Get project by ID with caching
   */
  async getProject(projectId: number, forceRefresh = false): Promise<Project> {
    // Try cache first
    if (!forceRefresh) {
      const cached = await this.projectModel.findOne({
        projectId,
        deletedAt: null,
      });

      if (cached && this.isCacheValid(cached.lastSyncedAt)) {
        this.logger.debug(`Cache hit for project ${projectId}`);
        return cached;
      }
    }

    // Fetch from blockchain
    this.logger.log(`Fetching project ${projectId} from blockchain`);
    const onChainProject = await this.blockchainService.getProject(projectId);

    // Update or create in database
    const updated = await this.projectModel.findOneAndUpdate(
      { projectId },
      {
        ...onChainProject,
        projectId,
        lastSyncedAt: new Date(),
        isCacheValid: true,
      },
      { upsert: true, new: true },
    );

    return updated;
  }

  /**
   * Get all projects with optional filtering
   */
  async getAllProjects(filter?: ProjectFilter): Promise<Project[]> {
    const query: any = { deletedAt: null };

    if (filter?.status !== undefined) {
      query.status = filter.status;
    }

    if (filter?.projectType) {
      query.projectType = filter.projectType;
    }

    if (filter?.location) {
      query.location = { $regex: filter.location, $options: 'i' };
    }

    if (filter?.search) {
      query.$text = { $search: filter.search };
    }

    if (filter?.maxPrice) {
      query.pricePerShare = { $lte: filter.maxPrice };
    }

    const projects = await this.projectModel.find(query).sort({ projectId: 1 });

    // Check if cache is stale for any project
    const staleProjects = projects.filter(
      (p) => !this.isCacheValid(p.lastSyncedAt),
    );

    if (staleProjects.length > 0) {
      this.logger.log(
        `Found ${staleProjects.length} stale projects, refreshing in background`,
      );
      // Refresh stale projects asynchronously
      this.refreshProjectsInBackground(staleProjects.map((p) => p.projectId));
    }

    return projects;
  }

  /**
   * Sync project from blockchain
   */
  async syncProject(projectId: number): Promise<Project> {
    return this.getProject(projectId, true);
  }

  /**
   * Sync all projects from blockchain
   */
  async syncAllProjects(): Promise<void> {
    this.logger.log('Starting full project sync from blockchain...');

    const onChainProjects = await this.blockchainService.getAllProjects();

    for (const onChainProject of onChainProjects) {
      await this.projectModel.findOneAndUpdate(
        { projectId: onChainProject.id },
        {
          ...onChainProject,
          projectId: onChainProject.id,
          lastSyncedAt: new Date(),
          isCacheValid: true,
        },
        { upsert: true },
      );
    }

    this.logger.log(`Synced ${onChainProjects.length} projects from blockchain`);
  }

  /**
   * Get project with analytics
   */
  async getProjectWithAnalytics(
    projectId: number,
  ): Promise<ProjectWithAnalytics> {
    const project = await this.getProject(projectId);
    const stats = await this.blockchainService.getProjectStats(projectId);

    const daysActive = Math.floor(
      (Date.now() - project.projectStartDate * 1000) / (1000 * 60 * 60 * 24),
    );

    const analytics = {
      averageDailyProduction: stats.averageDaily,
      capacityFactor: this.calculateCapacityFactor(
        stats.totalProduction,
        project.installationSizeKw,
        daysActive,
      ),
      performanceRatio: this.calculatePerformanceRatio(
        stats.totalProduction,
        project.estimatedAnnualKwh,
        daysActive,
      ),
      daysActive,
    };

    return {
      ...JSON.parse(JSON.stringify(project)),
      analytics,
    } as ProjectWithAnalytics;
  }

  /**
   * Update off-chain metadata
   */
  async updateMetadata(
    projectId: number,
    metadata: Partial<Project>,
  ): Promise<Project> {
    const updated = await this.projectModel.findOneAndUpdate(
      { projectId, deletedAt: null },
      {
        ...metadata,
        // Don't allow updating on-chain fields through this method
        projectId: undefined,
        status: undefined,
        totalShares: undefined,
        sharesSold: undefined,
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    return updated;
  }

  /**
   * Search projects with full-text search
   */
  async searchProjects(searchTerm: string): Promise<Project[]> {
    return this.projectModel
      .find({
        $text: { $search: searchTerm },
        deletedAt: null,
      })
      .sort({ score: { $meta: 'textScore' } });
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: number): Promise<Project[]> {
    return this.projectModel.find({ status, deletedAt: null });
  }

  /**
   * Cron job: Sync all projects every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledProjectSync() {
    this.logger.log('Running scheduled project sync...');
    try {
      await this.syncAllProjects();
    } catch (error) {
      this.logger.error('Scheduled project sync failed', error);
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

  /**
   * Helper: Refresh projects in background
   */
  private async refreshProjectsInBackground(projectIds: number[]) {
    for (const id of projectIds) {
      try {
        await this.getProject(id, true);
      } catch (error) {
        this.logger.error(`Failed to refresh project ${id}`, error);
      }
    }
  }

  /**
   * Helper: Calculate capacity factor
   */
  private calculateCapacityFactor(
    totalProduction: number,
    capacityKw: number,
    daysActive: number,
  ): number {
    if (daysActive === 0) return 0;
    const theoreticalMax = capacityKw * 24 * daysActive; // kWh
    return (totalProduction / theoreticalMax) * 100;
  }

  /**
   * Helper: Calculate performance ratio
   */
  private calculatePerformanceRatio(
    totalProduction: number,
    estimatedAnnualKwh: number,
    daysActive: number,
  ): number {
    if (daysActive === 0) return 0;
    const expectedProduction = (estimatedAnnualKwh / 365) * daysActive;
    return (totalProduction / expectedProduction) * 100;
  }
}
