import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { AppConfig } from '../config/configuration';
import { TelegramChatsService } from './telegram-chats.service';

@Injectable()
export class TelegramService implements OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly chats: TelegramChatsService,
  ) {}

  isEnabled(): boolean {
    return Boolean(this.config.get('telegramBotToken', { infer: true }));
  }

  getBot(): Telegraf | null {
    return this.bot;
  }

  setBot(bot: Telegraf): void {
    this.bot = bot;
  }

  onModuleDestroy(): void {
    void this.bot?.stop('shutdown');
  }

  async sendHtml(html: string): Promise<void> {
    if (!this.isEnabled() || !this.bot) {
      return;
    }

    const chatIds = this.chats.getTargetChatIds();
    if (chatIds.length === 0) {
      this.logger.debug('No Telegram chats subscribed; skip send');
      return;
    }

    await Promise.allSettled(
      chatIds.map((chatId) =>
        this.bot!.telegram.sendMessage(chatId, html, {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
        }),
      ),
    );
  }

  async sendPlain(text: string): Promise<void> {
    if (!this.isEnabled() || !this.bot) {
      return;
    }

    const chatIds = this.chats.getTargetChatIds();
    if (chatIds.length === 0) {
      return;
    }

    await Promise.allSettled(
      chatIds.map((chatId) => this.bot!.telegram.sendMessage(chatId, text)),
    );
  }
}
