import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { HttpAdapterHost } from '@nestjs/core';
import { CreateCountryDto } from 'src/modules/countries/dto/create-country.dto';
import { UpdateCountryDto } from 'src/modules/countries/dto/update-country.dto';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaClientExceptionFilter } from '../src/common/filters/prisma-client-exception.filter';

describe('CountriesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ADMIN_TOKEN =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJBZG1pbmlzdHJhdG9yIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLmNvbSIsImhhbmRsZSI6IlRvbnlKIiwiZXhwIjo1NTUzMDE5OTI1OSwidXNlcklkIjoiNDA0MzMyODgiLCJpYXQiOjE1MzAxOTg2NTksImVtYWlsIjoiYWRtaW5AdG9wY29kZXIuY29tIiwianRpIjoiYzNhYzYwOGEtNTZiZS00NWQwLThmNmEtMzFmZTk0Yjk1NjFjIn0.pIHUtMwIV07ZgfaUk9916X49rgjKclM9kzQP419LBo0';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));
    app.setGlobalPrefix('v6/lookups');

    await app.init();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "Country" RESTART IDENTITY CASCADE;',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('/v6/lookups/countries (POST)', () => {
    const countryDto: CreateCountryDto = {
      name: 'E2E Test Country',
      countryCode: 'E2E',
      countryFlag: 'http://e2e.com/flag.svg',
    };
    return request(app.getHttpServer())
      .post('/v6/lookups/countries')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(countryDto)
      .expect(HttpStatus.CREATED)
      .then((res) => {
        expect(res.body.result.name).toEqual(countryDto.name);
      });
  });

  it('/v6/lookups/countries (GET)', async () => {
    await prisma.country.create({
      data: {
        name: 'List Test Country',
        countryCode: 'LTC',
        countryFlag: 'http://list.com/flag.svg',
      },
    });
    return request(app.getHttpServer())
      .get('/v6/lookups/countries')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.result).toHaveLength(1);
        expect(res.body.result[0].name).toBe('List Test Country');
      });
  });

  it('/v6/lookups/countries (HEAD)', async () => {
    return request(app.getHttpServer())
      .head('/v6/lookups/countries')
      .expect(HttpStatus.OK);
  });

  it('/v6/lookups/countries/:id (GET)', async () => {
    const country = await prisma.country.create({
      data: {
        name: 'FindOne Test',
        countryCode: 'FOT',
        countryFlag: 'http://find.com/flag.svg',
      },
    });
    return request(app.getHttpServer())
      .get(`/v6/lookups/countries/${country.id}`)
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.result.id).toEqual(country.id);
      });
  });

  it('/v6/lookups/countries/:id (HEAD)', async () => {
    const country = await prisma.country.create({
      data: {
        name: 'Head Test',
        countryCode: 'HED',
        countryFlag: 'http://head.com/flag.svg',
      },
    });
    return request(app.getHttpServer())
      .head(`/v6/lookups/countries/${country.id}`)
      .expect(HttpStatus.OK);
  });

  it('/v6/lookups/countries/:id (PUT)', async () => {
    const country = await prisma.country.create({
      data: {
        name: 'Update Test',
        countryCode: 'UPD',
        countryFlag: 'http://update.com/flag.svg',
      },
    });
    const updateDto: CreateCountryDto = {
      name: 'Fully Updated Country',
      countryCode: 'FUC',
      countryFlag: 'http://updated.com/flag.svg',
    };
    return request(app.getHttpServer())
      .put(`/v6/lookups/countries/${country.id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(updateDto)
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.result.name).toEqual(updateDto.name);
      });
  });

  it('/v6/lookups/countries/:id (PATCH)', async () => {
    const country = await prisma.country.create({
      data: {
        name: 'Patch Test',
        countryCode: 'PAT',
        countryFlag: 'http://patch.com/flag.svg',
      },
    });
    const patchDto: UpdateCountryDto = { name: 'Partially Updated Country' };
    return request(app.getHttpServer())
      .patch(`/v6/lookups/countries/${country.id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(patchDto)
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.result.name).toEqual(patchDto.name);
      });
  });

  it('/v6/lookups/countries/:id (DELETE) - soft delete', async () => {
    const country = await prisma.country.create({
      data: {
        name: 'Soft Delete Test',
        countryCode: 'SDT',
        countryFlag: 'http://soft.com/flag.svg',
      },
    });
    await request(app.getHttpServer())
      .delete(`/v6/lookups/countries/${country.id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .expect(HttpStatus.NO_CONTENT);
    const deleted = await prisma.country.findFirst({
      where: { id: country.id, isDeleted: true },
    });
    expect(deleted).not.toBeNull();
  });

  it('/v6/lookups/countries/:id (DELETE) - hard delete', async () => {
    const country = await prisma.country.create({
      data: {
        name: 'Hard Delete Test',
        countryCode: 'HDT',
        countryFlag: 'http://hard.com/flag.svg',
      },
    });
    await request(app.getHttpServer())
      .delete(`/v6/lookups/countries/${country.id}?destroy=true`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .expect(HttpStatus.NO_CONTENT);
    const deleted = await prisma.country.findUnique({
      where: { id: country.id },
    });
    expect(deleted).toBeNull();
  });
});
