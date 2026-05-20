import { Injectable, Logger } from '@nestjs/common';
import { PolymarketWsService } from '../polymarket/polymarket-ws.service';
import { PositionSyncScheduler } from '../polymarket/position-sync.scheduler';
import { TelegramBootstrap } from '../telegram/telegram.bootstrap';

@Injectable()
export class DeferredStartupService {
  private readonly logger = new Logger(DeferredStartupService.name);

  constructor(
    private readonly ws: PolymarketWsService,
    private readonly sync: PositionSyncScheduler,
    private readonly telegram: TelegramBootstrap,
  ) {}

  start(): void {
    this.logger.log('Starting background services (WS, positions sync, Telegram)');
    try {
      this.ws.connect();
    } catch (error) {
      this.logger.error(
        `WebSocket connect failed: ${error instanceof Error ? error.message : error}`,
      );
    }
    void this.sync.sync();
    this.telegram.launchBot();
  }
}
