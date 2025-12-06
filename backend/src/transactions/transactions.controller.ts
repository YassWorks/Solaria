import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import {
  PurchaseSharesDto,
  EstimatePurchaseDto,
} from './dto/purchase-shares.dto';
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import type { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    userId: string;
    [key: string]: any;
  };
}

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('estimate')
  @ApiOperation({ summary: 'Estimate purchase cost before buying' })
  @ApiResponse({
    status: 200,
    description: 'Purchase estimate with all fees',
  })
  async estimatePurchase(
    @CurrentUser() user: any,
    @Body() dto: EstimatePurchaseDto,
  ) {
    const userId = user._id.toString();
    return this.transactionsService.estimatePurchase(
      userId,
      dto.projectId,
      dto.shares,
    );
  }

  @Post('purchase')
  @ApiOperation({
    summary: 'Purchase shares in a project',
    description:
      'Securely purchase project shares using encrypted wallet. Requires user password for wallet decryption.',
  })
  @ApiResponse({
    status: 201,
    description: 'Purchase initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or insufficient funds',
  })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async purchaseShares(
    @CurrentUser() user: any,
    @Req() req: AuthRequest,
    @Body() dto: PurchaseSharesDto,
  ) {
    const userId = user._id.toString();
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    return this.transactionsService.purchaseShares(
      userId,
      dto,
      ipAddress,
      userAgent,
    );
  }

  @Get('my-transactions')
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved',
  })
  async getMyTransactions(
    @CurrentUser() user: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
  ) {
    const userId = user._id.toString();
    return this.transactionsService.getUserTransactions(
      userId,
      limit || 50,
      skip || 0,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction details' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(@CurrentUser() user: any, @Param('id') id: string) {
    const userId = user._id.toString();
    return this.transactionsService.getTransaction(userId, id);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get project transaction history' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Project transactions retrieved',
  })
  async getProjectTransactions(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.transactionsService.getProjectTransactions(
      projectId,
      limit || 50,
    );
  }
}
