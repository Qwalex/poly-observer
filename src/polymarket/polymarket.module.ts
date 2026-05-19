import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { NotifyModule } from '../notify/notify.module';
import { PolymarketDataService } from './polymarket-data.service';
import { PolymarketWsService } from './polymarket-ws.service';
import { PositionSyncScheduler } from './position-sync.scheduler';
import { PositionTrackerService } from './position-tracker.service';
import { ProfitMonitorService } from './profit-monitor.service';

@Module({
  imports: [HttpModule, NotifyModule],
  providers: [
    PolymarketDataService,
    PolymarketWsService,
    PositionTrackerService,
    ProfitMonitorService,
    PositionSyncScheduler,
  ],
  exports: [
    PositionTrackerService,
    PolymarketWsService,
    PositionSyncScheduler,
    PolymarketDataService,
  ],
})
export class PolymarketModule {}
