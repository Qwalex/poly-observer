import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { TelegramService } from './telegram.service';

@Injectable()
export class TelegramBootstrap implements OnModuleInit {
  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly telegram: TelegramService,
  ) {}

  onModuleInit(): void {
    this.telegram.setBot(this.bot);
  }
}
