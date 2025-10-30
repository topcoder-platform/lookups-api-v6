import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      transactionOptions: {
        timeout: process.env.LOOKUPS_SERVICE_PRISMA_TIMEOUT
          ? parseInt(process.env.LOOKUPS_SERVICE_PRISMA_TIMEOUT)
          : 10000,
      },
    });
  }
  async onModuleInit() {
    // Connect to the database when the module is initialized.
    // The soft-delete logic is now handled in each respective service
    // to allow for both soft and hard deletes.
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', () => {
      app.close().catch(console.error);
    });
  }
}
