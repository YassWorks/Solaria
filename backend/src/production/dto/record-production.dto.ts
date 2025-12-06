import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString } from 'class-validator';

export class RecordProductionDto {
  @ApiProperty({
    example: 500,
    description: 'Amount of energy produced in kWh',
  })
  @IsNumber()
  @IsPositive()
  kwhProduced: number;

  @ApiProperty({
    example: 'Enphase API',
    description: 'Data source (e.g., Enphase API, SolarEdge, Manual)',
  })
  @IsString()
  dataSource: string;
}
