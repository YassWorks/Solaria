import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { LoginCredentialsDto } from './dto/login-credentials.dto';
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { User } from 'src/user/schemas/user.schema';
import { SignUpDto } from './dto/sign-up.dto';
import { createFileUploadInterceptor } from 'src/shared/interceptors/file-upload.interceptor';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and get your access token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiBadGatewayResponse({ description: 'Invalid credentials' })
  async login(@Body() loginCredentialsDto: LoginCredentialsDto) {
    return await this.authService.login(loginCredentialsDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('/verify-token')
  @ApiOperation({ summary: 'Verify if your JWT token is valid' })
  async verifyToken(@Req() req: any) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return { valid: false, expired: true, message: 'No token provided!' };
    }

    const token = authHeader.split(' ')[1];
    return this.authService.verifyToken(token);
  }

  @Get('/me')
  @ApiOperation({ summary: 'Get my profile' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'My profile' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request, please check your request',
  })
  async me(@CurrentUser() myProfile: User) {
    return myProfile;
  }

  @Post('/signup')
  @ApiOperation({ summary: 'Create a new user' })
  @UseInterceptors(
    createFileUploadInterceptor({
      fieldName: 'photoUrl',
      destination: 'users',
      allowedFileTypes: /\.(jpg|jpeg|png)$/i,
      fileSizeLimit: 1048576,
      defaultPhotoPath: 'uploads/defaults/defaultUserImage.jpeg',
    }),
  )
  @ApiResponse({ status: 201, description: 'User created successfully.', type: User })
  async signuo(@Body() signUpDto: SignUpDto) {
    return this.authService.SignUp(signUpDto);
  }
}
