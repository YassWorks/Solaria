import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import * as blockchainService_1 from './blockchain.service';

@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly blockchainService: blockchainService_1.BlockchainService,
  ) {}

  @Get('network')
  @ApiOperation({ summary: 'Get blockchain network information' })
  @ApiResponse({ status: 200, description: 'Network info retrieved' })
  async getNetworkInfo() {
    const provider = this.blockchainService.getProvider();
    const network = await provider.getNetwork();
    const gasPrice = await this.blockchainService.getGasPrice();

    return {
      success: true,
      network: {
        name: network.name,
        chainId: Number(network.chainId),
      },
      gasPrice: `${gasPrice} gwei`,
    };
  }

  @Get('projects')
  @ApiOperation({ summary: 'Get all projects from blockchain' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  async getAllProjects() {
    const projects = await this.blockchainService.getAllProjects();
    return {
      success: true,
      count: projects.length,
      projects,
    };
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', type: Number })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  async getProject(@Param('id') id: string) {
    const projectId = parseInt(id, 10);
    const project = await this.blockchainService.getProject(projectId);
    return {
      success: true,
      project,
    };
  }

  @Get('projects/:id/stats')
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiParam({ name: 'id', description: 'Project ID', type: Number })
  @ApiResponse({ status: 200, description: 'Project stats retrieved' })
  async getProjectStats(@Param('id') id: string) {
    const projectId = parseInt(id, 10);
    const stats = await this.blockchainService.getProjectStats(projectId);
    return {
      success: true,
      projectId,
      stats,
    };
  }

  @Get('projects/:id/production')
  @ApiOperation({ summary: 'Get production history for project' })
  @ApiParam({ name: 'id', description: 'Project ID', type: Number })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records to retrieve',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Production history retrieved' })
  async getProductionHistory(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const projectId = parseInt(id, 10);
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const history = await this.blockchainService.getProductionHistory(
      projectId,
      limitNum,
    );
    return {
      success: true,
      projectId,
      recordCount: history.length,
      history,
    };
  }

  @Get('investors/:address/portfolio')
  @ApiOperation({ summary: 'Get investor portfolio' })
  @ApiParam({
    name: 'address',
    description: 'Investor wallet address',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Portfolio retrieved successfully' })
  async getInvestorPortfolio(@Param('address') address: string) {
    const portfolio = await this.blockchainService.getUserPortfolio(address);
    return {
      success: true,
      address,
      projectCount: portfolio.length,
      portfolio,
    };
  }

  @Get('investors/:address/projects/:id/position')
  @ApiOperation({ summary: 'Get investor position in specific project' })
  @ApiParam({
    name: 'address',
    description: 'Investor wallet address',
    type: String,
  })
  @ApiParam({ name: 'id', description: 'Project ID', type: Number })
  @ApiResponse({ status: 200, description: 'Position retrieved successfully' })
  async getInvestorPosition(
    @Param('address') address: string,
    @Param('id') id: string,
  ) {
    const projectId = parseInt(id, 10);
    const position = await this.blockchainService.getInvestorPosition(
      projectId,
      address,
    );
    return {
      success: true,
      projectId,
      address,
      position,
    };
  }

  @Get('investors/:address/projects/:id/credits')
  @ApiOperation({ summary: 'Get claimable energy credits' })
  @ApiParam({
    name: 'address',
    description: 'Investor wallet address',
    type: String,
  })
  @ApiParam({ name: 'id', description: 'Project ID', type: Number })
  @ApiResponse({ status: 200, description: 'Credits retrieved successfully' })
  async getClaimableCredits(
    @Param('address') address: string,
    @Param('id') id: string,
  ) {
    const projectId = parseInt(id, 10);
    const credits = await this.blockchainService.getClaimableCredits(
      projectId,
      address,
    );
    return {
      success: true,
      projectId,
      address,
      claimableCredits: credits,
      unit: 'kWh',
    };
  }

  @Get('wallet/:address/balance')
  @ApiOperation({ summary: 'Get wallet DIONE balance' })
  @ApiParam({ name: 'address', description: 'Wallet address', type: String })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getWalletBalance(@Param('address') address: string) {
    const balance = await this.blockchainService.getWalletBalance(address);
    return {
      success: true,
      address,
      balance,
      currency: 'DIONE',
    };
  }

  @Get('gas-price')
  @ApiOperation({ summary: 'Get current gas price' })
  @ApiResponse({ status: 200, description: 'Gas price retrieved' })
  async getGasPrice() {
    const gasPrice = await this.blockchainService.getGasPrice();
    return {
      success: true,
      gasPrice,
      unit: 'gwei',
    };
  }

  @Post('projects/create')
  @ApiOperation({ summary: 'Create new project (Admin only)' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async createProject(
    @Body() projectParams: blockchainService_1.ProjectParams,
  ) {
    const result = await this.blockchainService.createProject(projectParams);
    return {
      ...result,
      message: 'Project created on blockchain',
    };
  }

  @Post('projects/:id/status')
  @ApiOperation({ summary: 'Update project status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Project ID', type: Number })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateProjectStatus(
    @Param('id') id: string,
    @Body() body: { status: number },
  ) {
    const projectId = parseInt(id, 10);
    const result = await this.blockchainService.updateProjectStatus(
      projectId,
      body.status,
    );
    return {
      ...result,
      message: 'Project status updated on blockchain',
    };
  }
}
