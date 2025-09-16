import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppConfigModule } from './common/config/app-config.module';
import { DatabaseModule } from './common/database/database.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProfileModule } from './modules/profile/profile.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    ProfileModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
