import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BlockchainService } from '../blockchain/blockchain.service';
import { OracleService } from '../blockchain/oracle/oracle.service';
import { RecordProductionDto } from './dto/record-production.dto';

@ApiTags('Production')
@Controller('production')
export class ProductionController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly oracleService: OracleService,
  ) {}

  @Get('project/:id/history')
  @ApiOperation({ summary: 'Get production history for project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records to return (default: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns production history with timestamps and kWh values',
  })
  async getProductionHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: number,
  ) {
    try {
      const history = await this.blockchainService.getProductionHistory(
        id,
        limit || 100,
      );
      return {
        success: true,
        data: history,
        count: history.length,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch production history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('project/:id/record')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Record production data (Oracle/Admin only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Production recorded successfully on blockchain',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async recordProduction(
    @Param('id', ParseIntPipe) id: number,
    @Body() recordProductionDto: RecordProductionDto,
  ) {
    try {
      const result = await this.oracleService.recordProductionManually(
        id,
        recordProductionDto.kwhProduced,
        recordProductionDto.dataSource,
      );
      return {
        success: true,
        message: 'Production recorded on blockchain',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to record production: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('project/:id/simulated')
  @ApiOperation({ summary: 'Get simulated production for current hour' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns simulated production in kWh for current time',
  })
  async getSimulatedProduction(@Param('id', ParseIntPipe) id: number) {
    try {
      const production = await this.oracleService.getSimulatedProduction(id);
      return {
        success: true,
        data: {
          projectId: id,
          currentHour: new Date().getHours(),
          simulatedKwh: production,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get simulated production',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('oracle/test')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Test oracle by triggering immediate production recording (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Oracle test triggered' })
  async testOracle() {
    try {
      await this.oracleService.testOracle();
      return {
        success: true,
        message: 'Oracle test completed - check logs for results',
      };
    } catch (error) {
      throw new HttpException(
        'Oracle test failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
