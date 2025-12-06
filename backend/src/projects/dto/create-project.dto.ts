import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsPositive,
  IsEthereumAddress,
  Min,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Austin Solar Farm', description: 'Project name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Austin, TX', description: 'Geographic location' })
  @IsString()
  location: string;

  @ApiProperty({
    example: 'Solar',
    description: 'Energy type (Solar, Wind, Hydro, Geothermal)',
  })
  @IsString()
  projectType: string;

  @ApiProperty({ example: 'Photovoltaic', description: 'Project subtype' })
  @IsString()
  projectSubtype: string;

  @ApiProperty({ example: 500, description: 'Installation size in kW' })
  @IsNumber()
  @IsPositive()
  installationSizeKw: number;

  @ApiProperty({
    example: 650000,
    description: 'Estimated annual production in kWh',
  })
  @IsNumber()
  @IsPositive()
  estimatedAnnualKwh: number;

  @ApiProperty({ example: 10000, description: 'Total number of shares' })
  @IsNumber()
  @IsPositive()
  totalShares: number;

  @ApiProperty({ example: '0.01', description: 'Price per share in DIONE' })
  @IsString()
  pricePerShare: string;

  @ApiProperty({
    example: 788400000,
    description: 'Project duration in seconds (25 years = 788400000)',
  })
  @IsNumber()
  @Min(0)
  projectDuration: number;

  @ApiProperty({
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    description: 'Wallet to receive investments',
  })
  @IsEthereumAddress()
  projectWallet: string;

  @ApiProperty({
    example: 'QmTest123abc...',
    description: 'IPFS hash of legal document',
  })
  @IsString()
  documentIPFS: string;
}
