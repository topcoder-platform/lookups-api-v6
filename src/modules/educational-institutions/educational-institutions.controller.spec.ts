import { EducationalInstitutionsService } from './educational-institutions.service';
import { Test, TestingModule } from '@nestjs/testing';

import { EducationalInstitutionsController } from './educational-institutions.controller';

describe('EducationalInstitutionsController', () => {
  let controller: EducationalInstitutionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EducationalInstitutionsController],
      providers: [{ provide: EducationalInstitutionsService, useValue: {} }],
    }).compile();

    controller = module.get<EducationalInstitutionsController>(
      EducationalInstitutionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
