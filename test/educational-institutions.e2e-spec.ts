import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaClientExceptionFilter } from '../src/common/filters/prisma-client-exception.filter';
import { CreateEducationalInstitutionDto } from 'src/modules/educational-institutions/dto/create-educational-institution.dto';
import { UpdateEducationalInstitutionDto } from 'src/modules/educational-institutions/dto/update-educational-institution.dto';

describe('EducationalInstitutionsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ADMIN_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJBZG1pbmlzdHJhdG9yIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLmNvbSIsImhhbmRsZSI6IlRvbnlKIiwiZXhwIjo1NTUzMDE5OTI1OSwidXNlcklkIjoiNDA0MzMyODgiLCJpYXQiOjE1MzAxOTg2NTksImVtYWlsIjoiYWRtaW5AdG9wY29kZXIuY29tIiwianRpIjoiYzNhYzYwOGEtNTZiZS00NWQwLThmNmEtMzFmZTk0Yjk1NjFjIn0.pIHUtMwIV07ZgfaUk9916X49rgjKclM9kzQP419LBo0';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '5',
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

    await app.init();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "EducationalInstitution" RESTART IDENTITY CASCADE;');
  });

  afterAll(async () => {
    await app.close();
  });

  it('/v5/lookups/educationalInstitutions (POST)', () => {
    const dto: CreateEducationalInstitutionDto = { name: 'Topcoder University' };
    return request(app.getHttpServer())
      .post('/v5/lookups/educationalInstitutions')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(dto)
      .expect(HttpStatus.CREATED)
      .then((res) => {
        expect(res.body.name).toEqual(dto.name);
      });
  });

  it('/v5/lookups/educationalInstitutions (GET)', async () => {
    await prisma.educationalInstitution.create({ data: { name: 'E2E Test University' } });
    return request(app.getHttpServer())
      .get('/v5/lookups/educationalInstitutions')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].name).toBe('E2E Test University');
      });
  });

  it('/v5/lookups/educationalInstitutions (HEAD)', () => {
    return request(app.getHttpServer())
      .head('/v5/lookups/educationalInstitutions')
      .expect(HttpStatus.OK);
  });

  it('/v5/lookups/educationalInstitutions/:id (GET)', async () => {
    const institution = await prisma.educationalInstitution.create({ data: { name: 'FindOne University' } });
    return request(app.getHttpServer())
      .get(`/v5/lookups/educationalInstitutions/${institution.id}`)
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.id).toEqual(institution.id);
      });
  });

  it('/v5/lookups/educationalInstitutions/:id (HEAD)', async () => {
    const institution = await prisma.educationalInstitution.create({ data: { name: 'Head University' } });
    return request(app.getHttpServer())
      .head(`/v5/lookups/educationalInstitutions/${institution.id}`)
      .expect(HttpStatus.OK);
  });

  it('/v5/lookups/educationalInstitutions/:id (PUT)', async () => {
    const institution = await prisma.educationalInstitution.create({ data: { name: 'Update University' } });
    const updateDto: CreateEducationalInstitutionDto = { name: 'Fully Updated University' };
    return request(app.getHttpServer())
      .put(`/v5/lookups/educationalInstitutions/${institution.id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(updateDto)
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.name).toEqual(updateDto.name);
      });
  });

  it('/v5/lookups/educationalInstitutions/:id (PATCH)', async () => {
    const institution = await prisma.educationalInstitution.create({ data: { name: 'Patch University' } });
    const patchDto: UpdateEducationalInstitutionDto = { name: 'Partially Updated University' };
    return request(app.getHttpServer())
      .patch(`/v5/lookups/educationalInstitutions/${institution.id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(patchDto)
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.name).toEqual(patchDto.name);
      });
  });

  it('/v5/lookups/educationalInstitutions/:id (DELETE)', async () => {
    const institution = await prisma.educationalInstitution.create({ data: { name: 'Delete University' } });
    await request(app.getHttpServer())
      .delete(`/v5/lookups/educationalInstitutions/${institution.id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .expect(HttpStatus.NO_CONTENT);
    const deleted = await prisma.educationalInstitution.findFirst({ where: { id: institution.id, isDeleted: true } });
    expect(deleted).not.toBeNull();
  });
});
