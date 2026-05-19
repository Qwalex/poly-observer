import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Subscription } from 'rxjs';
import { AppConfig } from '../config/configuration';
import { NotifyService } from '../notify/notify.service';
import { formatAlertMessage } from './positions.formatter';
import { PositionTrackerService } from './position-tracker.service';
import { TrackedPosition } from './types/position.types';

@Injectable()
export class ProfitMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProfitMonitorService.name);
  private subscription?: Subscription;
  private checkInterval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly tracker: PositionTrackerService,
    private readonly notify: NotifyService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  onModuleInit(): void {
    this.subscription = this.tracker.onPriceUpdate$.subscribe(() => {
      void this.evaluateAll();
    });

    this.checkInterval = setInterval(() => {
      void this.evaluateAll();
    }, 1000);
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  async evaluateAll(): Promise<void> {
    for (const position of this.tracker.getPositions()) {
      await this.evaluatePosition(position);
    }
  }

  private async evaluatePosition(position: TrackedPosition): Promise<void> {
    const threshold = this.config.get('profitThresholdPercent', {
      infer: true,
    });
    const intervalMs = this.config.get('notifyIntervalMs', { infer: true });

    if (position.percentPnl < threshold) {
      return;
    }

    const now = Date.now();
    if (now - position.lastNotifiedAt < intervalMs) {
      return;
    }

    const sign = position.cashPnl >= 0 ? '+' : '';
    const plain = [
      'Polymarket:',
      `«${position.title}»`,
      `${position.outcome} — profit ${sign}${position.percentPnl.toFixed(1)}%`,
      `(${sign}$${position.cashPnl.toFixed(2)}).`,
      `Mark ${position.markPrice.toFixed(3)}, avg ${position.avgPrice.toFixed(3)}`,
    ].join(' ');

    await this.notify.send(plain, formatAlertMessage(position));
    this.tracker.markNotified(position.key);
    this.logger.debug(`Alert for ${position.key}: ${position.percentPnl.toFixed(1)}%`);
  }
}
