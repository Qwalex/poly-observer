import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../config/configuration';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService<AppConfig, true>,
    @Optional() private readonly telegram?: TelegramService,
  ) {}

  async send(plainText: string, html?: string): Promise<void> {
    await Promise.allSettled([
      this.sendHttp(plainText),
      this.sendTelegram(html ?? plainText),
    ]);
  }

  private async sendHttp(text: string): Promise<void> {
    if (!this.config.get('notifyEnabled', { infer: true })) {
      return;
    }

    const url = this.config.get('notifyUrl', { infer: true });
    try {
      await firstValueFrom(
        this.http.post(url, { text }, { timeout: 10_000 }),
      );
      this.logger.log(`HTTP notification sent: ${text.slice(0, 80)}...`);
    } catch (error) {
      this.logger.error(
        `Failed HTTP notification: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async sendTelegram(html: string): Promise<void> {
    if (!this.telegram?.isEnabled()) {
      return;
    }

    try {
      await this.telegram.sendHtml(html);
      this.logger.log('Telegram notification sent');
    } catch (error) {
      this.logger.error(
        `Failed Telegram notification: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
