import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CountriesModule } from './modules/countries/countries.module';
import { DevicesModule } from './modules/devices/devices.module';
import { EducationalInstitutionsModule } from './modules/educational-institutions/educational-institutions.module';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { AuthMiddleware } from './auth/auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    CountriesModule,
    DevicesModule,
    EducationalInstitutionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the AuthMiddleware to all routes in the application.
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
