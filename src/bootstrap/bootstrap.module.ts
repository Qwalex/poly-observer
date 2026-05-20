import { Module } from '@nestjs/common';
import { PolymarketModule } from '../polymarket/polymarket.module';
import { DeferredStartupService } from './deferred-startup.service';

@Module({
  imports: [PolymarketModule],
  providers: [DeferredStartupService],
  exports: [DeferredStartupService],
})
export class BootstrapModule {}
