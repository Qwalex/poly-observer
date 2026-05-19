import { ConfigService } from '@nestjs/config';
import { Command, Ctx, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { AppConfig } from '../config/configuration';
import { formatPositionsMessage } from '../polymarket/positions.formatter';
import { PolymarketWsService } from '../polymarket/polymarket-ws.service';
import { PositionTrackerService } from '../polymarket/position-tracker.service';
import { PositionSyncScheduler } from '../polymarket/position-sync.scheduler';
import { TelegramChatsService } from './telegram-chats.service';

@Update()
export class TelegramUpdate {
  constructor(
    private readonly chats: TelegramChatsService,
    private readonly tracker: PositionTrackerService,
    private readonly ws: PolymarketWsService,
    private readonly sync: PositionSyncScheduler,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      return;
    }

    const ok = this.chats.register(chatId);
    if (!ok) {
      await ctx.reply('Доступ запрещён для этого чата.');
      return;
    }

    await ctx.reply(
      [
        'Polymarket Profit Watcher',
        '',
        'Команды:',
        '/positions — открытые сделки',
        '/status — статус монитора',
        '/refresh — обновить с Polymarket',
        '',
        `Порог алерта: ${this.config.get('profitThresholdPercent', { infer: true })}%`,
      ].join('\n'),
    );
  }

  @Command(['positions', 'deals', 'сделки'])
  async positions(@Ctx() ctx: Context): Promise<void> {
    if (!(await this.ensureAccess(ctx))) {
      return;
    }
    await this.replyPositions(ctx);
  }

  @Command('status')
  async status(@Ctx() ctx: Context): Promise<void> {
    if (!(await this.ensureAccess(ctx))) {
      return;
    }

    const address = this.config.get('positionsUserAddress', { infer: true });
    const lastSync = this.tracker.getLastSyncAt();
    const threshold = this.config.get('profitThresholdPercent', { infer: true });

    await ctx.reply(
      [
        '<b>Статус</b>',
        `Адрес: <code>${address}</code>`,
        `Позиций: ${this.tracker.getPositionCount()}`,
        `WebSocket: ${this.ws.isConnected() ? '✅' : '❌'}`,
        `Синхронизация: ${lastSync ? lastSync.toISOString() : '—'}`,
        `Порог алерта: ${threshold}%`,
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
  }

  @Command('refresh')
  async refresh(@Ctx() ctx: Context): Promise<void> {
    if (!(await this.ensureAccess(ctx))) {
      return;
    }

    await ctx.reply('Обновляю позиции…');
    try {
      await this.sync.sync();
      await this.replyPositions(ctx);
    } catch {
      await ctx.reply('Ошибка при загрузке позиций.');
    }
  }

  private async replyPositions(ctx: Context): Promise<void> {
    const positions = this.tracker.getPositions();
    const text = formatPositionsMessage(positions, {
      header: `<b>Открытые сделки</b> (${positions.length})`,
      emptyText: 'Нет открытых сделок. /refresh — загрузить с API.',
    });

    if (text.length > 4000) {
      await ctx.reply(text.slice(0, 4000), { parse_mode: 'HTML' });
      await ctx.reply(text.slice(4000), { parse_mode: 'HTML' });
      return;
    }

    await ctx.reply(text, { parse_mode: 'HTML' });
  }

  private async ensureAccess(ctx: Context): Promise<boolean> {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      return false;
    }

    const allowed = this.config.get('telegramAllowedChatIds', { infer: true });
    if (allowed.length > 0 && !allowed.includes(chatId)) {
      await ctx.reply('Доступ запрещён. Укажите chat id в TELEGRAM_ALLOWED_CHAT_IDS.');
      return false;
    }

    if (!this.chats.getTargetChatIds().includes(chatId)) {
      this.chats.register(chatId);
    }

    return true;
  }
}
