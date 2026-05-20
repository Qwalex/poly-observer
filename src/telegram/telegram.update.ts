import { ConfigService } from '@nestjs/config';
import { Command, Ctx, Hears, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { AppConfig } from '../config/configuration';
import {
  MESSAGE_SEP,
  formatHelpMessage,
  formatPositionsMessage,
  formatStatusMessage,
  formatWelcomeMessage,
} from '../polymarket/positions.formatter';
import { PolymarketWsService } from '../polymarket/polymarket-ws.service';
import { PositionTrackerService } from '../polymarket/position-tracker.service';
import { PositionSyncScheduler } from '../polymarket/position-sync.scheduler';
import {
  BTN_HELP,
  BTN_POSITIONS,
  BTN_REFRESH,
  BTN_STATUS,
  mainMenuExtra,
} from './telegram.keyboard';
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
      await ctx.reply('⛔ Доступ запрещён для этого чата.');
      return;
    }

    const threshold = this.config.get('profitThresholdPercent', {
      infer: true,
    });
    await ctx.reply(formatWelcomeMessage(threshold), mainMenuExtra());
  }

  @Hears(BTN_POSITIONS)
  @Command(['positions', 'deals', 'сделки'])
  async positions(@Ctx() ctx: Context): Promise<void> {
    if (!(await this.ensureAccess(ctx))) {
      return;
    }
    await this.replyPositions(ctx);
  }

  @Hears(BTN_STATUS)
  @Command('status')
  async status(@Ctx() ctx: Context): Promise<void> {
    if (!(await this.ensureAccess(ctx))) {
      return;
    }

    const text = formatStatusMessage({
      address: this.config.get('positionsUserAddress', { infer: true }),
      positionsCount: this.tracker.getPositionCount(),
      wsConnected: this.ws.isConnected(),
      lastSyncAt: this.tracker.getLastSyncAt(),
      threshold: this.config.get('profitThresholdPercent', { infer: true }),
    });

    await ctx.reply(text, mainMenuExtra());
  }

  @Hears(BTN_REFRESH)
  @Command('refresh')
  async refresh(@Ctx() ctx: Context): Promise<void> {
    if (!(await this.ensureAccess(ctx))) {
      return;
    }

    await ctx.reply('⏳ Обновляю позиции…', mainMenuExtra());
    try {
      await this.sync.sync();
      await this.replyPositions(ctx);
    } catch {
      await ctx.reply('❌ Ошибка при загрузке. Попробуйте позже.', mainMenuExtra());
    }
  }

  @Hears(BTN_HELP)
  @Command('help')
  async help(@Ctx() ctx: Context): Promise<void> {
    if (!(await this.ensureAccess(ctx))) {
      return;
    }

    const threshold = this.config.get('profitThresholdPercent', {
      infer: true,
    });
    await ctx.reply(formatHelpMessage(threshold), mainMenuExtra());
  }

  private async replyPositions(ctx: Context): Promise<void> {
    const positions = this.tracker.getPositions();
    const text = formatPositionsMessage(positions);

    const chunks = this.splitHtmlMessage(text, 3800);
    for (let i = 0; i < chunks.length; i++) {
      const extra = i === chunks.length - 1 ? mainMenuExtra() : { parse_mode: 'HTML' as const };
      await ctx.reply(chunks[i], extra);
    }
  }

  private splitHtmlMessage(text: string, maxLen: number): string[] {
    if (text.length <= maxLen) {
      return [text];
    }

    const parts = text.split(`\n\n${MESSAGE_SEP}\n\n`);
    const header = parts[0];
    const cards = parts.slice(1);
    const chunks: string[] = [];
    let current = header;

    for (const card of cards) {
      const block = `\n\n${MESSAGE_SEP}\n\n${card}`;
      if ((current + block).length > maxLen) {
        if (current) {
          chunks.push(current);
        }
        current = card;
      } else {
        current += block;
      }
    }

    if (current) {
      chunks.push(current);
    }

    return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
  }

  private async ensureAccess(ctx: Context): Promise<boolean> {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      return false;
    }

    const allowed = this.config.get('telegramAllowedChatIds', { infer: true });
    if (allowed.length > 0 && !allowed.includes(chatId)) {
      await ctx.reply(
        '⛔ Доступ запрещён. Добавьте chat id в TELEGRAM_ALLOWED_CHAT_IDS.',
        mainMenuExtra(),
      );
      return false;
    }

    if (!this.chats.getTargetChatIds().includes(chatId)) {
      this.chats.register(chatId);
    }

    return true;
  }
}
