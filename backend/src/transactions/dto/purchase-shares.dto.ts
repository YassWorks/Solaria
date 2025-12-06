import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class PurchaseSharesDto {
  @ApiProperty({
    description: 'Project ID to invest in',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  projectId: number;

  @ApiProperty({
    description: 'Number of shares to purchase',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  shares: number;

  @ApiProperty({
    description: 'User password for wallet decryption (required for security)',
    example: 'SecurePassword123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: '2FA code (if enabled)',
    example: '123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  twoFactorCode?: string;
}

export class EstimatePurchaseDto {
  @ApiProperty({
    description: 'Project ID',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  projectId: number;

  @ApiProperty({
    description: 'Number of shares',
    example: 10,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  shares: number;
}
