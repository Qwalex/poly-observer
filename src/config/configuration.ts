import * as Joi from 'joi';

const ethAddress = Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/);

function resolvePositionsUserAddress(): string {
  return (
    process.env.POSITIONS_USER_ADDRESS ??
    process.env.USER_ADDRESS ??
    process.env.RELAYER_API_KEY_ADDRESS ??
    process.env.POLYMARKET_USER_ADDRESS ??
    ''
  );
}

function resolveTelegramBotToken(): string | undefined {
  return (
    process.env.TELEGRAM_BOT_API ??
    process.env.TELEGREM_BOT_API ??
    process.env.TELEGRAM_BOT_TOKEN
  );
}

function parseChatIds(raw?: string): number[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
}

export interface AppConfig {
  userAddress: string;
  positionsUserAddress: string;
  relayerApiKey?: string;
  relayerApiKeyAddress?: string;
  telegramBotToken?: string;
  telegramChatId?: number;
  telegramAllowedChatIds: number[];
  profitThresholdPercent: number;
  notifyUrl: string;
  notifyEnabled: boolean;
  notifyIntervalMs: number;
  positionsPollIntervalMs: number;
  port: number;
  host: string;
  dataApiBaseUrl: string;
  marketWsUrl: string;
}

export const configuration = (): AppConfig => {
  const userAddress = process.env.USER_ADDRESS ?? '';
  const relayerApiKeyAddress = process.env.RELAYER_API_KEY_ADDRESS;
  const positionsUserAddress = resolvePositionsUserAddress();
  const telegramChatId = process.env.TELEGRAM_CHAT_ID
    ? Number(process.env.TELEGRAM_CHAT_ID)
    : undefined;

  return {
    userAddress,
    positionsUserAddress,
    relayerApiKey: process.env.RELAYER_API_KEY,
    relayerApiKeyAddress,
    telegramBotToken: resolveTelegramBotToken(),
    telegramChatId: Number.isFinite(telegramChatId)
      ? telegramChatId
      : undefined,
    telegramAllowedChatIds: parseChatIds(
      process.env.TELEGRAM_ALLOWED_CHAT_IDS,
    ),
    profitThresholdPercent: Number(process.env.PROFIT_THRESHOLD_PERCENT ?? 20),
    notifyUrl: process.env.NOTIFY_URL ?? 'https://notify.qwalex.one',
    notifyEnabled: process.env.NOTIFY_HTTP_ENABLED !== 'false',
    notifyIntervalMs: Number(process.env.NOTIFY_INTERVAL_MS ?? 5000),
    positionsPollIntervalMs: Number(
      process.env.POSITIONS_POLL_INTERVAL_MS ?? 30000,
    ),
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? '0.0.0.0',
    dataApiBaseUrl:
      process.env.DATA_API_BASE_URL ?? 'https://data-api.polymarket.com',
    marketWsUrl:
      process.env.MARKET_WS_URL ??
      'wss://ws-subscriptions-clob.polymarket.com/ws/market',
  };
};

export const validationSchema = Joi.object({
  POSITIONS_USER_ADDRESS: ethAddress.optional(),
  USER_ADDRESS: ethAddress.optional(),
  RELAYER_API_KEY: Joi.string().uuid().optional(),
  RELAYER_API_KEY_ADDRESS: ethAddress.optional(),
  POLYMARKET_USER_ADDRESS: ethAddress.optional(),
  TELEGRAM_BOT_API: Joi.string().optional(),
  TELEGREM_BOT_API: Joi.string().optional(),
  TELEGRAM_BOT_TOKEN: Joi.string().optional(),
  TELEGRAM_CHAT_ID: Joi.number().integer().optional(),
  TELEGRAM_ALLOWED_CHAT_IDS: Joi.string().optional(),
  PROFIT_THRESHOLD_PERCENT: Joi.number().default(20),
  NOTIFY_URL: Joi.string().uri().default('https://notify.qwalex.one'),
  NOTIFY_HTTP_ENABLED: Joi.boolean().default(true),
  NOTIFY_INTERVAL_MS: Joi.number().integer().min(1000).default(5000),
  POSITIONS_POLL_INTERVAL_MS: Joi.number().integer().min(5000).default(30000),
  PORT: Joi.number().integer().min(1).max(65535).optional(),
  HOST: Joi.string().default('0.0.0.0'),
  DATA_API_BASE_URL: Joi.string().uri().optional(),
  MARKET_WS_URL: Joi.string().uri().optional(),
})
  .or(
    'POSITIONS_USER_ADDRESS',
    'USER_ADDRESS',
    'RELAYER_API_KEY_ADDRESS',
    'POLYMARKET_USER_ADDRESS',
  )
  .and('RELAYER_API_KEY', 'RELAYER_API_KEY_ADDRESS')
  .custom((value, helpers) => {
    const positionsAddress =
      value.POSITIONS_USER_ADDRESS ??
      value.USER_ADDRESS ??
      value.RELAYER_API_KEY_ADDRESS ??
      value.POLYMARKET_USER_ADDRESS;
    if (!positionsAddress) {
      return helpers.error('any.custom', {
        message:
          'Set USER_ADDRESS (or RELAYER_API_KEY_ADDRESS / POLYMARKET_USER_ADDRESS) for position tracking',
      });
    }
    return value;
  });
