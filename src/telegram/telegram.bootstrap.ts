import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { AppConfig } from '../config/configuration';
import { TelegramService } from './telegram.service';

@Injectable()
export class TelegramBootstrap {
  private readonly logger = new Logger(TelegramBootstrap.name);

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly telegram: TelegramService,
    @Optional() @InjectBot() private readonly bot?: Telegraf,
  ) {}

  launchBot(): void {
    if (!this.bot || !this.config.get('telegramBotToken', { infer: true })) {
      return;
    }

    this.telegram.setBot(this.bot);
    void this.bot
      .launch({ dropPendingUpdates: true })
      .then(() => this.logger.log('Telegram bot polling started'))
      .catch((err: Error) =>
        this.logger.error(`Telegram bot launch failed: ${err.message}`),
      );
  }
}
