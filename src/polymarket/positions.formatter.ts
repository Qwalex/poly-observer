import { TrackedPosition } from './types/position.types';

export function formatPositionLine(p: TrackedPosition, index: number): string {
  const sign = p.cashPnl >= 0 ? '+' : '';
  return [
    `${index}. <b>${escapeHtml(p.title)}</b>`,
    `   ${escapeHtml(p.outcome)} · size ${p.size.toFixed(2)}`,
    `   PnL: <b>${sign}${p.percentPnl.toFixed(1)}%</b> (${sign}$${p.cashPnl.toFixed(2)})`,
    `   mark ${p.markPrice.toFixed(3)} · avg ${p.avgPrice.toFixed(3)}`,
  ].join('\n');
}

export function formatPositionsMessage(
  positions: TrackedPosition[],
  options?: { header?: string; emptyText?: string },
): string {
  if (positions.length === 0) {
    return options?.emptyText ?? 'Нет открытых сделок.';
  }

  const sorted = [...positions].sort((a, b) => b.percentPnl - a.percentPnl);
  const lines = sorted.map((p, i) => formatPositionLine(p, i + 1));
  const header = options?.header ?? `Открытые сделки (${sorted.length}):`;
  return [header, '', ...lines].join('\n');
}

export function formatAlertMessage(position: TrackedPosition): string {
  const sign = position.cashPnl >= 0 ? '+' : '';
  return [
    '🚨 <b>Profit alert</b>',
    `<b>${escapeHtml(position.title)}</b>`,
    `${escapeHtml(position.outcome)} — <b>${sign}${position.percentPnl.toFixed(1)}%</b> (${sign}$${position.cashPnl.toFixed(2)})`,
    `mark ${position.markPrice.toFixed(3)} · avg ${position.avgPrice.toFixed(3)}`,
  ].join('\n');
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
