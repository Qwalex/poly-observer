import { DynamicModule, Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { AppConfig } from '../config/configuration';
import { PolymarketModule } from '../polymarket/polymarket.module';
import { TelegramChatsService } from './telegram-chats.service';
import { TelegramService } from './telegram.service';
import { TelegramBootstrap } from './telegram.bootstrap';
import { TelegramUpdate } from './telegram.update';

@Module({})
export class TelegramModule {
  static register(): DynamicModule {
    const token =
      process.env.TELEGRAM_BOT_API ??
      process.env.TELEGREM_BOT_API ??
      process.env.TELEGRAM_BOT_TOKEN;

    const providers = [TelegramChatsService, TelegramService];
    const exports = [TelegramService, TelegramChatsService];

    if (!token) {
      return {
        module: TelegramModule,
        providers,
        exports,
      };
    }

    return {
      module: TelegramModule,
      imports: [
        TelegrafModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService<AppConfig, true>) => ({
            token: config.get('telegramBotToken', { infer: true })!,
            launchOptions: { dropPendingUpdates: true },
          }),
        }),
        forwardRef(() => PolymarketModule),
      ],
      providers: [...providers, TelegramUpdate, TelegramBootstrap],
      exports,
      global: true,
    };
  }
}
