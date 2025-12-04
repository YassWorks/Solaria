import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginCredentialsDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: '12345678' })
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  @ApiProperty({ example: '12345678' })
  password: string;
}
