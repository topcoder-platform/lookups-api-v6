import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaClientExceptionFilter } from '../src/common/filters/prisma-client-exception.filter';
import { CreateDeviceDto } from '../src/modules/devices/dto/create-device.dto';
import { UpdateDeviceDto } from '../src/modules/devices/dto/update-device.dto';

describe('DevicesController (e2e)', () => {
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
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Device" RESTART IDENTITY CASCADE;');
  });

  afterAll(async () => {
    await app.close();
  });

  it('/v5/lookups/devices (POST)', () => {
    const deviceDto: CreateDeviceDto = {
      type: 'Laptop',
      manufacturer: 'Apple',
      model: 'MacBook Pro 16',
      operatingSystem: 'macOS',
      operatingSystemVersion: 'Sonoma',
    };
    return request(app.getHttpServer())
      .post('/v5/lookups/devices')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(deviceDto)
      .expect(HttpStatus.CREATED)
      .then((res) => {
        expect(res.body.model).toEqual(deviceDto.model);
      });
  });

  it('/v5/lookups/devices (GET)', async () => {
    await prisma.device.create({ data: { type: 'Laptop', manufacturer: 'Apple', model: 'MacBook Air' } });
    return request(app.getHttpServer())
      .get('/v5/lookups/devices')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].model).toBe('MacBook Air');
      });
  });

  it('/v5/lookups/devices (HEAD)', () => {
    return request(app.getHttpServer())
      .head('/v5/lookups/devices')
      .expect(HttpStatus.OK);
  });

  it('/v5/lookups/devices/:id (GET)', async () => {
    const device = await prisma.device.create({ data: { type: 'Tablet', manufacturer: 'Samsung', model: 'Galaxy Tab' } });
    return request(app.getHttpServer())
      .get(`/v5/lookups/devices/${device.id}`)
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body.id).toEqual(device.id);
      });
  });

  it('/v5/lookups/devices/:id (HEAD)', async () => {
    const device = await prisma.device.create({ data: { type: 'Watch', manufacturer: 'Google', model: 'Pixel Watch' } });
    return request(app.getHttpServer())
      .head(`/v5/lookups/devices/${device.id}`)
      .expect(HttpStatus.OK);
  });

  it('/v5/lookups/devices/types (GET)', async () => {
    await prisma.device.createMany({
      data: [
        { type: 'Laptop', manufacturer: 'A', model: '1' },
        { type: 'Smartphone', manufacturer: 'B', model: '2' },
        { type: 'Laptop', manufacturer: 'C', model: '3' },
      ],
    });
    return request(app.getHttpServer())
      .get('/v5/lookups/devices/types')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body).toEqual(expect.arrayContaining(['Laptop', 'Smartphone']));
        expect(res.body.length).toBe(2);
      });
  });

  it('/v5/lookups/devices/manufacturers (GET)', async () => {
    await prisma.device.createMany({
      data: [
        { type: 'Laptop', manufacturer: 'Dell', model: 'XPS' },
        { type: 'Laptop', manufacturer: 'HP', model: 'Spectre' },
        { type: 'Smartphone', manufacturer: 'Google', model: 'Pixel' },
      ],
    });
    return request(app.getHttpServer())
      .get('/v5/lookups/devices/manufacturers?type=Laptop')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body).toEqual(expect.arrayContaining(['Dell', 'HP']));
        expect(res.body.length).toBe(2);
      });
  });

  it('/v5/lookups/devices/models (GET)', async () => {
    await prisma.device.createMany({
      data: [
        { type: 'Laptop', manufacturer: 'Apple', model: 'MacBook Air' },
        { type: 'Laptop', manufacturer: 'Apple', model: 'MacBook Pro' },
        { type: 'Smartphone', manufacturer: 'Apple', model: 'iPhone 15' },
      ],
    });
    return request(app.getHttpServer())
      .get('/v5/lookups/devices/models?type=Laptop&manufacturer=Apple')
      .expect(HttpStatus.OK)
      .then((res) => {
        expect(res.body).toEqual(expect.arrayContaining(['MacBook Air', 'MacBook Pro']));
        expect(res.body.length).toBe(2);
      });
  });

  it('/v5/lookups/devices/:id (PUT)', async () => {
    const device = await prisma.device.create({ data: { type: 'Test', manufacturer: 'Test', model: 'Old' } });
    const updateDto: CreateDeviceDto = { type: 'Updated', manufacturer: 'Updated', model: 'New' };
    return request(app.getHttpServer())
      .put(`/v5/lookups/devices/${device.id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(updateDto)
      .expect(HttpStatus.OK)
      .then(res => {
        expect(res.body.model).toBe('New');
      });
  });

  it('/v5/lookups/devices/:id (PATCH)', async () => {
    const device = await prisma.device.create({ data: { type: 'Test', manufacturer: 'Test', model: 'Old' } });
    const patchDto: UpdateDeviceDto = { model: 'Patched' };
    return request(app.getHttpServer())
      .patch(`/v5/lookups/devices/${device.id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send(patchDto)
      .expect(HttpStatus.OK)
      .then(res => {
        expect(res.body.model).toBe('Patched');
      });
  });

  it('/v5/lookups/devices/:id (DELETE)', async () => {
    const device = await prisma.device.create({ data: { type: 'Test', manufacturer: 'Test', model: 'ToDelete' } });
    await request(app.getHttpServer())
      .delete(`/v5/lookups/devices/${device.id}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .expect(HttpStatus.NO_CONTENT);
    const deleted = await prisma.device.findFirst({ where: { id: device.id, isDeleted: true } });
    expect(deleted).not.toBeNull();
  });
});
