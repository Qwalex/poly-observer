import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';

@Injectable()
export class TelegramChatsService {
  private readonly logger = new Logger(TelegramChatsService.name);
  private readonly subscribed = new Set<number>();

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    const allowed = this.config.get('telegramAllowedChatIds', { infer: true });
    for (const id of allowed) {
      this.subscribed.add(id);
    }
    const fixed = this.config.get('telegramChatId', { infer: true });
    if (fixed) {
      this.subscribed.add(fixed);
    }
    if (this.subscribed.size > 0) {
      this.logger.log(
        `Telegram alert chats: ${[...this.subscribed].join(', ')}`,
      );
    }
  }

  register(chatId: number): boolean {
    const allowed = this.config.get('telegramAllowedChatIds', { infer: true });
    if (allowed.length > 0 && !allowed.includes(chatId)) {
      return false;
    }
    this.subscribed.add(chatId);
    this.logger.log(`Telegram chat registered: ${chatId}`);
    return true;
  }

  getTargetChatIds(): number[] {
    return [...this.subscribed];
  }

  hasTargets(): boolean {
    return this.subscribed.size > 0;
  }
}
