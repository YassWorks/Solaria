import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ProjectsService, ProjectFilter } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all energy projects with caching' })
  @ApiQuery({ name: 'status', required: false, enum: [0, 1, 2, 3] })
  @ApiQuery({ name: 'projectType', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({
    status: 200,
    description: 'Returns all projects with details',
  })
  async getAllProjects(
    @Query('status') status?: string,
    @Query('projectType') projectType?: string,
    @Query('location') location?: string,
    @Query('search') search?: string,
  ) {
    try {
      const filter: ProjectFilter = {
        status: status ? parseInt(status) : undefined,
        projectType,
        location,
        search,
      };

      const projects = await this.projectsService.getAllProjects(filter);
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
  @ApiOperation({ summary: 'Get project by ID with caching' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiQuery({ name: 'refresh', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Returns project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProject(
    @Param('id', ParseIntPipe) id: number,
    @Query('refresh') refresh?: string,
  ) {
    try {
      const project = await this.projectsService.getProject(
        id,
        refresh === 'true',
      );
      return {
        success: true,
        data: project,
      };
    } catch (error) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get project with performance analytics' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns project with calculated analytics',
  })
  async getProjectAnalytics(@Param('id', ParseIntPipe) id: number) {
    try {
      const projectWithAnalytics =
        await this.projectsService.getProjectWithAnalytics(id);
      return {
        success: true,
        data: projectWithAnalytics,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch project analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      
      // Sync new project to database
      if (result.success && result.projectId) {
        await this.projectsService.syncProject(result.projectId);
      }
      
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

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually sync project from blockchain' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project synced successfully' })
  async syncProject(@Param('id', ParseIntPipe) id: number) {
    try {
      const project = await this.projectsService.syncProject(id);
      return {
        success: true,
        message: 'Project synced from blockchain',
        data: project,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to sync project',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync all projects from blockchain' })
  @ApiResponse({ status: 200, description: 'All projects synced' })
  async syncAllProjects() {
    try {
      await this.projectsService.syncAllProjects();
      return {
        success: true,
        message: 'All projects synced successfully',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to sync projects',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/metadata')
  @ApiOperation({ summary: 'Update project off-chain metadata' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Metadata updated' })
  async updateMetadata(
    @Param('id', ParseIntPipe) id: number,
    @Body() metadata: any,
  ) {
    try {
      const updated = await this.projectsService.updateMetadata(id, metadata);
      return {
        success: true,
        message: 'Project metadata updated',
        data: updated,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to update metadata',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
