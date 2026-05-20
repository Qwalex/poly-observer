import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { AppConfig } from '../config/configuration';
import { TelegramChatsService } from './telegram-chats.service';
import { TelegramBootstrap } from './telegram.bootstrap';
import { TelegramService } from './telegram.service';

@Module({})
export class TelegramModule {
  static register(): DynamicModule {
    const token =
      process.env.TELEGRAM_BOT_API ??
      process.env.TELEGREM_BOT_API ??
      process.env.TELEGRAM_BOT_TOKEN;

    const providers = [TelegramChatsService, TelegramService, TelegramBootstrap];
    const exports = [TelegramService, TelegramChatsService, TelegramBootstrap];

    if (!token) {
      return {
        module: TelegramModule,
        providers,
        exports,
        global: true,
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
            launchOptions: false,
          }),
        }),
      ],
      providers,
      exports,
      global: true,
    };
  }
}
