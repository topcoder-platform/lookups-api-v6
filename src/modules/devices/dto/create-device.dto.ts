import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeviceDto {
  @ApiProperty({ description: 'The type of the device.', example: 'Smartphone' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'The manufacturer of the device.', example: 'Apple' })
  @IsString()
  @IsNotEmpty()
  manufacturer: string;

  @ApiProperty({ description: 'The model of the device.', example: 'iPhone 15 Pro' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ description: 'The operating system of the device.', example: 'iOS', required: false })
  @IsString()
  @IsOptional()
  operatingSystem?: string;

  @ApiProperty({ description: 'The version of the operating system.', example: '17.5', required: false })
  @IsString()
  @IsOptional()
  operatingSystemVersion?: string;
}
