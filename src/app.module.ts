import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { configuration, validationSchema } from './config/configuration';
import { HealthModule } from './health/health.module';
import { PolymarketModule } from './polymarket/polymarket.module';
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
    HealthModule,
  ],
})
export class AppModule {}
 