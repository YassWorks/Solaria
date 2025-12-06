import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpException,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InvestorsService } from './investors.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@ApiTags('Investors')
@Controller('investors')
export class InvestorsController {
  constructor(
    private readonly investorsService: InvestorsService,
    private readonly blockchainService: BlockchainService,
  ) {}

  @Get(':address/portfolio')
  @ApiOperation({ summary: 'Get investor portfolio with caching' })
  @ApiParam({
    name: 'address',
    description: 'Ethereum wallet address',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  })
  @ApiQuery({ name: 'refresh', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Returns investor portfolio with all investments',
  })
  async getPortfolio(
    @Param('address') address: string,
    @Query('refresh') refresh?: string,
  ) {
    try {
      const portfolio = await this.investorsService.getInvestorPortfolio(
        address,
        refresh === 'true',
      );
      return {
        success: true,
        data: portfolio,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch portfolio',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':address/analytics')
  @ApiOperation({ summary: 'Get investor analytics and performance metrics' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'Investor analytics' })
  async getAnalytics(@Param('address') address: string) {
    try {
      const analytics =
        await this.investorsService.getInvestorAnalytics(address);
      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch analytics',
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
      const position = await this.investorsService.getProjectPosition(
        address,
        projectId,
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
          valueEstimate: credits * 0.12, // Estimate at $0.12/kWh
        },
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch credits',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':address/link-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Link wallet address to user account' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'Wallet linked to user' })
  async linkWalletToUser(
    @Param('address') address: string,
    @Body() body: { userId: string },
  ) {
    try {
      const investor = await this.investorsService.linkWalletToUser(
        address,
        body.userId,
      );
      return {
        success: true,
        message: 'Wallet linked to user account',
        data: investor,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to link wallet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':address/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually sync investor data from blockchain' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'Investor data synced' })
  async syncInvestor(@Param('address') address: string) {
    try {
      const investor = await this.investorsService.syncInvestor(address);
      return {
        success: true,
        message: 'Investor data synced from blockchain',
        data: investor,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to sync investor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get top investors leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Top investors' })
  async getLeaderboard(@Query('limit') limit?: string) {
    try {
      const topInvestors = await this.investorsService.getTopInvestors(
        limit ? parseInt(limit) : 10,
      );
      return {
        success: true,
        data: topInvestors,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch leaderboard',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
