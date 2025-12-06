import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({
    description: 'User password for wallet encryption',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}

export class VerifyPasswordDto {
  @ApiProperty({
    description: 'Password to verify',
    example: 'SecurePassword123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
