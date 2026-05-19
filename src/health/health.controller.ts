import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { PolymarketWsService } from '../polymarket/polymarket-ws.service';
import { PositionTrackerService } from '../polymarket/position-tracker.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly tracker: PositionTrackerService,
    private readonly ws: PolymarketWsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      positionsUserAddress: this.config.get('positionsUserAddress', {
        infer: true,
      }),
      userAddress: this.config.get('userAddress', { infer: true }) || null,
      relayerConfigured: Boolean(
        this.config.get('relayerApiKey', { infer: true }),
      ),
      telegramEnabled: Boolean(
        this.config.get('telegramBotToken', { infer: true }),
      ),
      positionsCount: this.tracker.getPositionCount(),
      wsConnected: this.ws.isConnected(),
      lastSyncAt: this.tracker.getLastSyncAt()?.toISOString() ?? null,
      positions: this.tracker.getPositions().map((p) => ({
        key: p.key,
        title: p.title,
        outcome: p.outcome,
        percentPnl: Number(p.percentPnl.toFixed(2)),
        cashPnl: Number(p.cashPnl.toFixed(2)),
        markPrice: Number(p.markPrice.toFixed(4)),
        avgPrice: Number(p.avgPrice.toFixed(4)),
      })),
    };
  }
}
