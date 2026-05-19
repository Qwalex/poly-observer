import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { PolymarketDataService } from './polymarket-data.service';
import { PolymarketWsService } from './polymarket-ws.service';
import { PositionTrackerService } from './position-tracker.service';
import { ProfitMonitorService } from './profit-monitor.service';

@Injectable()
export class PositionSyncScheduler
  implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(PositionSyncScheduler.name);
  private pollTimer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly data: PolymarketDataService,
    private readonly tracker: PositionTrackerService,
    private readonly ws: PolymarketWsService,
    private readonly monitor: ProfitMonitorService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  onModuleInit(): void {
    const intervalMs = this.config.get('positionsPollIntervalMs', {
      infer: true,
    });
    this.pollTimer = setInterval(() => void this.sync(), intervalMs);
  }

  onApplicationBootstrap(): void {
    void this.sync();
  }

  onModuleDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  async sync(): Promise<void> {
    try {
      const dtos = await this.data.fetchPositions();
      const assetIds = this.tracker.reconcile(dtos);
      this.ws.updateSubscriptions(assetIds);
      const address = this.config.get('positionsUserAddress', { infer: true });
      this.logger.log(
        `Synced ${assetIds.length} position(s) for ${address}`,
      );
      await this.monitor.evaluateAll();
    } catch {
      // errors logged in data service
    }
  }
}
