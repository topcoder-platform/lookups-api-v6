import { Test, TestingModule } from '@nestjs/testing';
import { EducationalInstitutionsService } from './educational-institutions.service';

describe('EducationalInstitutionsService', () => {
  let service: EducationalInstitutionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EducationalInstitutionsService],
    }).compile();

    service = module.get<EducationalInstitutionsService>(EducationalInstitutionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
