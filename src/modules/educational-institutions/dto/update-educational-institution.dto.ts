import { PartialType } from '@nestjs/swagger';
import { CreateEducationalInstitutionDto } from './create-educational-institution.dto';

export class UpdateEducationalInstitutionDto extends PartialType(
  CreateEducationalInstitutionDto,
) {}
