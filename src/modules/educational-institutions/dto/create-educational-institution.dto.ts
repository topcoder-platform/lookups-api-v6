import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEducationalInstitutionDto {
  @ApiProperty({
    description: 'The name of the educational institution.',
    example: 'Topcoder University',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
