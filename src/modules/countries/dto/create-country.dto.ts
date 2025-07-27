import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCountryDto {
  @ApiProperty({
    description: 'The name of the country.',
    example: 'New Zealand',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'A URL to the country flag image.',
    example: 'https://flags.com/nz.svg',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  countryFlag: string;

  @ApiProperty({
    description: 'The ISO 3166-1 alpha-3 country code.',
    example: 'NZL',
  })
  @IsString()
  @IsNotEmpty()
  countryCode: string;
}
