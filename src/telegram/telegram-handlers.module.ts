import { Module } from '@nestjs/common';
import { PolymarketModule } from '../polymarket/polymarket.module';
import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [PolymarketModule],
  providers: [TelegramUpdate],
})
export class TelegramHandlersModule {}
