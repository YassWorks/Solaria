import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { Role } from 'src/shared/Enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  readonly cin: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  readonly password: string;

  @ApiProperty({ enum: Role, example: Role.USER })
  @IsEnum(Role)
  readonly role: Role;

  @ApiPropertyOptional({ example: '0xWalletAddressHere' })
  @IsOptional()
  @IsString()
  readonly walletAddress?: string;

  @ApiPropertyOptional({ example: 'encryptedWalletHere' })
  @IsOptional()
  @IsString()
  readonly encryptedWallet?: string;
}
