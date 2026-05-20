import {
  BTN_POSITIONS,
  BTN_REFRESH,
  BTN_STATUS,
} from '../telegram/menu.labels';
import { TrackedPosition } from './types/position.types';

export const MESSAGE_SEP = '────────────────';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(text: string, max = 48): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}

function pnlEmoji(percent: number): string {
  if (percent >= 20) {
    return '🟢';
  }
  if (percent > 0) {
    return '🟡';
  }
  if (percent < 0) {
    return '🔴';
  }
  return '⚪';
}

function formatMoney(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatPositionCard(p: TrackedPosition, index: number): string {
  const emoji = pnlEmoji(p.percentPnl);
  const title = escapeHtml(truncate(p.title));
  const outcome = escapeHtml(p.outcome);

  return [
    `${index}. ${emoji} <b>${title}</b>`,
    `    <i>${outcome}</i> · ${p.size.toFixed(1)} sh`,
    `    PnL <b>${formatPercent(p.percentPnl)}</b> · ${formatMoney(p.cashPnl)}`,
    `    <code>${p.markPrice.toFixed(3)}</code> mark · <code>${p.avgPrice.toFixed(3)}</code> avg`,
  ].join('\n');
}

export function formatPositionsSummary(positions: TrackedPosition[]): string {
  const totalCash = positions.reduce((sum, p) => sum + p.cashPnl, 0);
  const inProfit = positions.filter((p) => p.percentPnl > 0).length;
  const aboveThreshold = positions.filter((p) => p.percentPnl >= 20).length;

  return [
    `📊 <b>Открытые сделки</b> — ${positions.length}`,
    `💰 Итого: <b>${formatMoney(totalCash)}</b>`,
    `📈 В плюсе: ${inProfit}/${positions.length}`,
    aboveThreshold > 0 ? `🎯 ≥20%: ${aboveThreshold}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatPositionsMessage(
  positions: TrackedPosition[],
  options?: { emptyText?: string },
): string {
  if (positions.length === 0) {
    return options?.emptyText ?? '📭 <b>Нет открытых сделок</b>\n\nНажмите 🔄 Обновить';
  }

  const sorted = [...positions].sort((a, b) => b.percentPnl - a.percentPnl);
  const cards = sorted.map((p, i) => formatPositionCard(p, i + 1));

  return [formatPositionsSummary(positions), MESSAGE_SEP, ...cards].join('\n\n');
}

export function formatStatusMessage(params: {
  address: string;
  positionsCount: number;
  wsConnected: boolean;
  lastSyncAt: Date | null;
  threshold: number;
}): string {
  const sync = params.lastSyncAt
    ? params.lastSyncAt.toLocaleString('ru-RU', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      })
    : '—';

  return [
    '📡 <b>Статус монитора</b>',
    '',
    `🔗 Кошелёк:\n<code>${params.address}</code>`,
    '',
    `📂 Позиций: <b>${params.positionsCount}</b>`,
    `🌐 WebSocket: ${params.wsConnected ? '✅ online' : '❌ offline'}`,
    `🕐 Синхронизация: ${sync} UTC`,
    `🎯 Порог алерта: <b>${params.threshold}%</b>`,
  ].join('\n');
}

export function formatWelcomeMessage(threshold: number): string {
  return [
    '👋 <b>Polymarket Profit Watcher</b>',
    '',
    'Слежу за вашими позициями и шлю алерт, когда profit ≥ порога.',
    '',
    `🎯 Сейчас порог: <b>${threshold}%</b>`,
    '',
    'Пользуйтесь кнопками внизу 👇',
  ].join('\n');
}

export function formatHelpMessage(threshold: number): string {
  return [
    '❓ <b>Справка</b>',
    '',
    `${BTN_POSITIONS} — список сделок и PnL`,
    `${BTN_STATUS} — WS и синхронизация`,
    `${BTN_REFRESH} — загрузить с API`,
    '',
    `🚨 Алерт при profit ≥ <b>${threshold}%</b>`,
    '⏱ Не чаще 1 раза в 5 сек на сделку',
  ].join('\n');
}

export function formatAlertMessage(position: TrackedPosition): string {
  const emoji = pnlEmoji(position.percentPnl);
  const title = escapeHtml(truncate(position.title, 56));
  const outcome = escapeHtml(position.outcome);

  return [
    '🚨 <b>Profit alert</b>',
    '',
    `${emoji} <b>${title}</b>`,
    `<i>${outcome}</i>`,
    '',
    `📈 <b>${formatPercent(position.percentPnl)}</b>`,
    `💵 <b>${formatMoney(position.cashPnl)}</b>`,
    `📊 <code>${position.markPrice.toFixed(3)}</code> mark · <code>${position.avgPrice.toFixed(3)}</code> avg`,
  ].join('\n');
}
