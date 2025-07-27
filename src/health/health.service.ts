import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    // A simple, fast query to check if the database is reachable and responsive.
    await this.prisma.$queryRaw(Prisma.sql`SELECT 1`);
    return {
      status: 'ok',
      info: {
        database: {
          status: 'up',
        },
      },
      error: {},
      details: {
        database: {
          status: 'up',
        },
      },
    };
  }
}
