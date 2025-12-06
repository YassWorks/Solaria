import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateWalletDto, VerifyPasswordDto } from './dto/create-wallet.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { User } from './schemas/user.schema';
import { PaginationQueryDto } from 'src/config/pagination/dto/pagination-query.dto';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/Enums/role.enum';
import { createFileUploadInterceptor } from 'src/shared/interceptors/file-upload.interceptor';
import { CurrentUser } from 'src/shared/decorators/user.decorator';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully.',
    type: User,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    createFileUploadInterceptor({
      fieldName: 'photoUrl',
      destination: 'users',
      allowedFileTypes: /\.(jpg|jpeg|png)$/i,
      fileSizeLimit: 1048576,
      defaultPhotoPath: 'uploads/defaults/defaultUserImage.jpeg',
    }),
  )
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users (paginated)' })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.userService.findAll(paginationQuery);
  }

  @Get(':email')
  @ApiOperation({ summary: 'Get user by email' })
  async findOne(@Param('email') email: string) {
    return this.userService.findOneByEmail(email);
  }

  @Patch(':id')
  @UseInterceptors(
    createFileUploadInterceptor({
      fieldName: 'photoUrl',
      destination: 'users',
      allowedFileTypes: /\.(jpg|jpeg|png)$/i,
      fileSizeLimit: 1048576,
    }),
  )
  @ApiOperation({ summary: 'Update user by ID' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user' })
  async softDelete(@Param('id') id: string) {
    return this.userService.softDelete(id);
  }

  @Post('wallet/create')
  @ApiOperation({
    summary: 'Create a new wallet for the authenticated user',
    description:
      'Creates a new blockchain wallet. Private key is encrypted with user password and stored securely.',
  })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  @ApiResponse({ status: 400, description: 'User already has a wallet' })
  async createWallet(@CurrentUser() user:any, @Body() dto: CreateWalletDto) {
    const userId = user._id.toString();
    return this.userService.createWallet(userId, dto.password);
  }

  @Get('wallet/info')
  @ApiOperation({ summary: 'Get wallet information for authenticated user' })
  @ApiResponse({ status: 200, description: 'Wallet info retrieved' })
  async getWalletInfo(@CurrentUser() user:any) {
    const userId = user._id.toString();
    return this.userService.getWalletInfo(userId);
  }

  @Post('wallet/verify')
  @ApiOperation({ summary: 'Verify wallet password' })
  @ApiResponse({ status: 200, description: 'Password verification result' })
  async verifyWalletPassword(
    @CurrentUser() user:any,
    @Body() dto: VerifyPasswordDto,
  ) {
    const userId = user._id.toString();
    const isValid = await this.userService.verifyWalletPassword(
      userId,
      dto.password,
    );
    return { valid: isValid };
  }
}
