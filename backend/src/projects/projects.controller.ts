import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get()
  @ApiOperation({ summary: 'Get all energy projects' })
  @ApiResponse({
    status: 200,
    description: 'Returns all projects with details',
  })
  async getAllProjects() {
    try {
      const projects = await this.blockchainService.getAllProjects();
      return {
        success: true,
        data: projects,
        count: projects.length,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch projects',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Returns project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProject(@Param('id', ParseIntPipe) id: number) {
    try {
      const project = await this.blockchainService.getProject(id);
      return {
        success: true,
        data: project,
      };
    } catch (error) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get project production statistics' })
  @ApiResponse({
    status: 200,
    description:
      'Returns project stats including total production, record count, average daily production',
  })
  async getProjectStats(@Param('id', ParseIntPipe) id: number) {
    try {
      const stats = await this.blockchainService.getProjectStats(id);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch project stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new energy project (Admin only)' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Failed to create project' })
  async createProject(@Body() createProjectDto: CreateProjectDto) {
    try {
      const result =
        await this.blockchainService.createProject(createProjectDto);
      return {
        success: true,
        message: 'Project created successfully on blockchain',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create project: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
