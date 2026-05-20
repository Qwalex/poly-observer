import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { configuration, validationSchema } from './config/configuration';
import { HealthModule } from './health/health.module';
import { PolymarketModule } from './polymarket/polymarket.module';
import { TelegramHandlersModule } from './telegram/telegram-handlers.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    ScheduleModule.forRoot(),
    TelegramModule.register(),
    PolymarketModule,
    TelegramHandlersModule,
    BootstrapModule,
    HealthModule,
  ],
})
export class AppModule {}
