import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OracleService } from './oracle.service';

@ApiTags('Oracle')
@Controller('oracle')
export class OracleController {
  constructor(private readonly oracleService: OracleService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get oracle status and configuration' })
  @ApiResponse({ status: 200, description: 'Oracle status retrieved' })
  async getStatus() {
    const status = await this.oracleService.getOracleStatus();
    return {
      success: true,
      ...status,
    };
  }

  @Get('mode')
  @ApiOperation({ summary: 'Check if oracle is in simulation mode' })
  @ApiResponse({ status: 200, description: 'Oracle mode retrieved' })
  getMode() {
    return {
      mode: this.oracleService.isSimulationMode() ? 'simulation' : 'real',
      simulation: this.oracleService.isSimulationMode(),
      message: this.oracleService.isSimulationMode()
        ? 'Oracle running in SIMULATION mode - no blockchain writes'
        : 'Oracle running in REAL mode - actual blockchain transactions',
    };
  }

  @Post('test')
  @ApiOperation({ summary: 'Test oracle by recording production immediately' })
  @ApiResponse({ status: 200, description: 'Oracle test completed' })
  async testOracle() {
    await this.oracleService.testOracle();
    return {
      success: true,
      message: 'Oracle test completed',
      mode: this.oracleService.isSimulationMode() ? 'simulation' : 'real',
    };
  }

  @Post('record')
  @ApiOperation({ summary: 'Manually record production for a project' })
  @ApiResponse({ status: 200, description: 'Production recorded successfully' })
  async recordProduction(
    @Body()
    body: {
      projectId: number;
      kwhProduced: number;
      source: string;
    },
  ) {
    const result = await this.oracleService.recordProductionManually(
      body.projectId,
      body.kwhProduced,
      body.source,
    );

    return {
      ...result,
      mode: this.oracleService.isSimulationMode() ? 'simulation' : 'real',
    };
  }

  @Get('simulation/project/:id/history')
  @ApiOperation({
    summary: 'Get simulated production history (simulation mode only)',
  })
  @ApiResponse({ status: 200, description: 'Production history retrieved' })
  getSimulatedHistory(@Param('id') projectId: string) {
    const id = parseInt(projectId, 10);

    if (!this.oracleService.isSimulationMode()) {
      return {
        success: false,
        error: 'Only available in simulation mode',
        mode: 'real',
      };
    }

    const history = this.oracleService.getSimulatedProductionHistory(id);
    const total = this.oracleService.getTotalSimulatedProduction(id);

    return {
      success: true,
      projectId: id,
      mode: 'simulation',
      history,
      total,
      recordCount: history.length,
    };
  }

  @Get('simulation/project/:id/total')
  @ApiOperation({
    summary: 'Get total simulated production (simulation mode only)',
  })
  @ApiResponse({ status: 200, description: 'Total production retrieved' })
  getSimulatedTotal(@Param('id') projectId: string) {
    const id = parseInt(projectId, 10);

    if (!this.oracleService.isSimulationMode()) {
      return {
        success: false,
        error: 'Only available in simulation mode',
        mode: 'real',
      };
    }

    const total = this.oracleService.getTotalSimulatedProduction(id);

    return {
      success: true,
      projectId: id,
      mode: 'simulation',
      totalKwh: total,
    };
  }

  @Get('project/:id/simulated-production')
  @ApiOperation({
    summary: 'Get current hour simulated production for a project',
  })
  @ApiResponse({
    status: 200,
    description: 'Simulated production for current hour',
  })
  async getSimulatedProduction(@Param('id') projectId: string) {
    const id = parseInt(projectId, 10);
    const production = await this.oracleService.getSimulatedProduction(id);
    const currentHour = new Date().getHours();

    return {
      success: true,
      projectId: id,
      currentHour,
      simulatedProduction: production,
      unit: 'kWh',
    };
  }
}
