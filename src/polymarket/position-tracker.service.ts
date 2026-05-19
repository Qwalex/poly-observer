import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import {
  calcPnl,
  PolymarketPositionDto,
  positionKey,
  TrackedPosition,
} from './types/position.types';

export interface PriceUpdate {
  assetId: string;
  markPrice: number;
}

@Injectable()
export class PositionTrackerService {
  private readonly positions = new Map<string, TrackedPosition>();
  private lastSyncAt: Date | null = null;
  private readonly priceUpdates$ = new Subject<PriceUpdate>();

  readonly onPriceUpdate$ = this.priceUpdates$.asObservable();

  getPositions(): TrackedPosition[] {
    return [...this.positions.values()];
  }

  getPositionCount(): number {
    return this.positions.size;
  }

  getLastSyncAt(): Date | null {
    return this.lastSyncAt;
  }

  getSubscribedAssetIds(): string[] {
    return [...new Set([...this.positions.values()].map((p) => p.asset))];
  }

  reconcile(dtos: PolymarketPositionDto[]): string[] {
    const active = dtos.filter(
      (p) => Number(p.size) > 0 && !p.redeemable,
    );
    const activeKeys = new Set<string>();

    for (const dto of active) {
      const key = positionKey(dto.conditionId, dto.asset);
      activeKeys.add(key);
      const existing = this.positions.get(key);
      const markPrice =
        existing?.markPrice ?? Number(dto.curPrice ?? dto.avgPrice);
      const { percentPnl, cashPnl } = calcPnl(
        Number(dto.size),
        Number(dto.avgPrice),
        markPrice,
      );

      this.positions.set(key, {
        key,
        asset: dto.asset,
        conditionId: dto.conditionId,
        size: Number(dto.size),
        avgPrice: Number(dto.avgPrice),
        markPrice,
        percentPnl: dto.percentPnl ?? percentPnl,
        cashPnl: dto.cashPnl ?? cashPnl,
        title: dto.title ?? dto.slug ?? dto.conditionId,
        outcome: dto.outcome ?? 'Unknown',
        redeemable: Boolean(dto.redeemable),
        lastNotifiedAt: existing?.lastNotifiedAt ?? 0,
      });
    }

    for (const key of [...this.positions.keys()]) {
      if (!activeKeys.has(key)) {
        this.positions.delete(key);
      }
    }

    this.lastSyncAt = new Date();
    return this.getSubscribedAssetIds();
  }

  updateMarkPrice(assetId: string, markPrice: number): void {
    let updated = false;

    for (const position of this.positions.values()) {
      if (position.asset !== assetId) {
        continue;
      }
      position.markPrice = markPrice;
      const { percentPnl, cashPnl } = calcPnl(
        position.size,
        position.avgPrice,
        markPrice,
      );
      position.percentPnl = percentPnl;
      position.cashPnl = cashPnl;
      updated = true;
    }

    if (updated) {
      this.priceUpdates$.next({ assetId, markPrice });
    }
  }

  markNotified(key: string): void {
    const position = this.positions.get(key);
    if (position) {
      position.lastNotifiedAt = Date.now();
    }
  }
}
