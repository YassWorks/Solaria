import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BlockchainService } from '../blockchain.service';

@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);

  constructor(private blockchainService: BlockchainService) {}

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
            await this.blockchainService.recordProduction(
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
  ) {
    try {
      this.logger.log(
        `Manual recording: ${kwhProduced} kWh for project ${projectId}`,
      );
      return await this.blockchainService.recordProduction(
        projectId,
        kwhProduced,
        source,
      );
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
    this.logger.log(
      '🧪 Testing oracle - recording production for all projects...',
    );
    await this.recordHourlyProduction();
  }
}
