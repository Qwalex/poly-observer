import './load-env';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DeferredStartupService } from './bootstrap/deferred-startup.service';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : undefined,
  });

  app.enableShutdownHooks();

  const config = app.get(ConfigService<AppConfig, true>);
  const port = config.get('port', { infer: true });
  const host = config.get('host', { infer: true });

  await app.listen(port, host);
  Logger.log(
    `Polymarket Profit Watcher listening on ${host}:${port}`,
    'Bootstrap',
  );

  app.get(DeferredStartupService).start();
}

process.on('uncaughtException', (err) => {
  Logger.error(`Uncaught exception: ${err.message}`, err.stack, 'Process');
});

process.on('unhandledRejection', (reason) => {
  Logger.error(`Unhandled rejection: ${reason}`, undefined, 'Process');
});

bootstrap();
