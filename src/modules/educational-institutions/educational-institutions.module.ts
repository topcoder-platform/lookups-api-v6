import { Module } from '@nestjs/common';
import { EducationalInstitutionsService } from './educational-institutions.service';
import { EducationalInstitutionsController } from './educational-institutions.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EducationalInstitutionsController],
  providers: [EducationalInstitutionsService],
})
export class EducationalInstitutionsModule {}
