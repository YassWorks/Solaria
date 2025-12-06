import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BlockchainService } from '../blockchain/blockchain.service';

@ApiTags('Investors')
@Controller('investors')
export class InvestorsController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get(':address/portfolio')
  @ApiOperation({ summary: 'Get investor portfolio across all projects' })
  @ApiParam({
    name: 'address',
    description: 'Ethereum wallet address',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns investor portfolio with all investments',
  })
  async getPortfolio(@Param('address') address: string) {
    try {
      const portfolio = await this.blockchainService.getUserPortfolio(address);

      // Calculate totals
      const totals = portfolio.reduce(
        (acc, item) => ({
          totalShares: acc.totalShares + item.position.shares,
          totalInvested:
            acc.totalInvested + parseFloat(item.position.totalInvested),
          totalLifetimeKwh: acc.totalLifetimeKwh + item.position.lifetimeKwh,
          totalClaimableKwh: acc.totalClaimableKwh + item.position.claimableKwh,
        }),
        {
          totalShares: 0,
          totalInvested: 0,
          totalLifetimeKwh: 0,
          totalClaimableKwh: 0,
        },
      );

      return {
        success: true,
        data: {
          portfolio,
          totals,
        },
        projectCount: portfolio.length,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch portfolio',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':address/project/:projectId')
  @ApiOperation({ summary: 'Get investor position in specific project' })
  @ApiParam({ name: 'address', description: 'Ethereum wallet address' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns position details for specific project',
  })
  async getPosition(
    @Param('address') address: string,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    try {
      const position = await this.blockchainService.getInvestorPosition(
        projectId,
        address,
      );
      return {
        success: true,
        data: position,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch position',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':address/project/:projectId/credits')
  @ApiOperation({ summary: 'Get claimable energy credits for investor' })
  @ApiParam({ name: 'address', description: 'Ethereum wallet address' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns claimable energy credits in kWh',
  })
  async getClaimableCredits(
    @Param('address') address: string,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    try {
      const credits = await this.blockchainService.getClaimableCredits(
        projectId,
        address,
      );
      return {
        success: true,
        data: {
          projectId,
          investorAddress: address,
          claimableKwh: credits,
          valueEstimate: credits * 0.15, // Rough estimate at €0.15/kWh
        },
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch credits',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
