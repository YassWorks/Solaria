import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { LoginCredentialsDto } from './dto/login-credentials.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(credentials: LoginCredentialsDto) {
    const user = await this.userService.findOneByEmail(credentials.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const hashedPassword = await bcrypt.hash(credentials.password, user.salt);
    const isMatch = hashedPassword === user.password;
    if (!isMatch) throw new UnauthorizedException('Incorrect password');

    const payload = {
      _id: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      role: user.role,
    };
  }

  async verifyToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('SECRET_KEY'),
      });

      return {
        valid: true,
        expired: false,
        payload,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { valid: false, expired: true };
      }
      return { valid: false, expired: true, message: 'Invalid token' };
    }
  }
}
