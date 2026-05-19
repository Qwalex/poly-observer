export interface PolymarketPositionDto {
  proxyWallet?: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  curPrice?: number;
  initialValue?: number;
  currentValue?: number;
  cashPnl?: number;
  percentPnl?: number;
  realizedPnl?: number;
  percentRealizedPnl?: number;
  redeemable?: boolean;
  mergeable?: boolean;
  title?: string;
  slug?: string;
  icon?: string;
  outcome?: string;
  outcomeIndex?: number;
  endDate?: string;
  negativeRisk?: boolean;
}

export interface TrackedPosition {
  key: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  markPrice: number;
  percentPnl: number;
  cashPnl: number;
  title: string;
  outcome: string;
  redeemable: boolean;
  lastNotifiedAt: number;
}

export function positionKey(conditionId: string, asset: string): string {
  return `${conditionId}:${asset}`;
}

export function calcPnl(
  size: number,
  avgPrice: number,
  markPrice: number,
): { percentPnl: number; cashPnl: number } {
  if (avgPrice <= 0) {
    return { percentPnl: 0, cashPnl: 0 };
  }
  const percentPnl = (markPrice / avgPrice - 1) * 100;
  const cashPnl = size * (markPrice - avgPrice);
  return { percentPnl, cashPnl };
}
