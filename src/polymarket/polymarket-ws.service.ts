import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebSocket } from 'ws';
import { AppConfig } from '../config/configuration';
import { PositionTrackerService } from './position-tracker.service';

@Injectable()
export class PolymarketWsService implements OnModuleDestroy {
  private readonly logger = new Logger(PolymarketWsService.name);
  private ws: WebSocket | null = null;
  private pingInterval?: ReturnType<typeof setInterval>;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;
  private subscribedAssets: string[] = [];
  private reconnectAttempt = 0;
  private destroyed = false;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly tracker: PositionTrackerService,
  ) {}

  onModuleDestroy(): void {
    this.destroyed = true;
    this.clearTimers();
    this.teardownSocket();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  isConnecting(): boolean {
    return this.ws?.readyState === WebSocket.CONNECTING;
  }

  updateSubscriptions(assetIds: string[]): void {
    const unique = [...new Set(assetIds)].sort();
    const prev = [...this.subscribedAssets].sort().join(',');
    const next = unique.join(',');

    this.subscribedAssets = unique;

    if (prev === next && (this.isConnected() || this.isConnecting())) {
      return;
    }

    if (unique.length === 0) {
      return;
    }

    if (this.isConnected()) {
      this.sendSubscription(unique);
      return;
    }

    if (this.isConnecting()) {
      return;
    }

    this.connect();
  }

  connect(): void {
    if (this.destroyed || this.isConnected() || this.isConnecting()) {
      return;
    }

    const url = this.config.get('marketWsUrl', { infer: true });
    this.clearTimers();
    this.teardownSocket();

    this.logger.log(`Connecting to market WebSocket: ${url}`);
    const socket = new WebSocket(url);
    this.ws = socket;

    socket.on('open', () => {
      if (this.ws !== socket) {
        return;
      }
      this.reconnectAttempt = 0;
      this.logger.log('Market WebSocket connected');
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('PING');
        }
      }, 10_000);

      if (this.subscribedAssets.length > 0) {
        this.sendSubscription(this.subscribedAssets);
      }
    });

    socket.on('message', (raw) => {
      const data = raw.toString();
      if (data === 'PONG' || data === 'PING') {
        return;
      }
      this.handleMessage(data);
    });

    socket.on('close', () => {
      if (this.ws !== socket) {
        return;
      }
      this.logger.warn('Market WebSocket closed');
      this.ws = null;
      this.scheduleReconnect();
    });

    socket.on('error', (err) => {
      this.logger.error(`Market WebSocket error: ${err.message}`);
    });
  }

  private scheduleReconnect(): void {
    if (this.destroyed) {
      return;
    }
    this.clearTimers();
    const delay = Math.min(30_000, 1000 * 2 ** this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.logger.log(`Reconnecting in ${delay}ms`);
    this.reconnectTimeout = setTimeout(() => this.connect(), delay);
  }

  private clearTimers(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }

  private teardownSocket(): void {
    const socket = this.ws;
    if (!socket) {
      return;
    }
    this.ws = null;
    socket.removeAllListeners();
    socket.on('error', () => undefined);
    try {
      socket.terminate();
    } catch {
      // ignore
    }
  }

  private sendSubscription(assetIds: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    const payload = {
      assets_ids: assetIds,
      type: 'market',
      custom_feature_enabled: true,
    };
    this.ws.send(JSON.stringify(payload));
    this.logger.log(`Subscribed to ${assetIds.length} asset(s)`);
  }

  private handleMessage(raw: string): void {
    try {
      const msg = JSON.parse(raw) as Record<string, unknown>;
      const eventType = msg.event_type as string | undefined;

      if (eventType === 'best_bid_ask') {
        const assetId = String(msg.asset_id ?? '');
        const bestBid = parseFloat(String(msg.best_bid ?? '0'));
        if (assetId && bestBid > 0) {
          this.tracker.updateMarkPrice(assetId, bestBid);
        }
        return;
      }

      if (eventType === 'last_trade_price') {
        const assetId = String(msg.asset_id ?? '');
        const price = parseFloat(String(msg.price ?? '0'));
        if (assetId && price > 0) {
          this.tracker.updateMarkPrice(assetId, price);
        }
        return;
      }

      if (eventType === 'price_change') {
        const changes = msg.price_changes as
          | Array<{ asset_id?: string; best_bid?: string }>
          | undefined;
        if (!changes) {
          return;
        }
        for (const change of changes) {
          const assetId = String(change.asset_id ?? '');
          const bestBid = parseFloat(String(change.best_bid ?? '0'));
          if (assetId && bestBid > 0) {
            this.tracker.updateMarkPrice(assetId, bestBid);
          }
        }
      }
    } catch {
      // ignore non-JSON frames
    }
  }
}
