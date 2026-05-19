import { Module } from '@nestjs/common';
import { PolymarketModule } from '../polymarket/polymarket.module';
import { HealthController } from './health.controller';
import { RootController } from './root.controller';

@Module({
  imports: [PolymarketModule],
  controllers: [HealthController, RootController],
})
export class HealthModule {}
