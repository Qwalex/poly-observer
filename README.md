# Polymarket Profit Watcher

NestJS-сервис отслеживает все открытые позиции на Polymarket по вашему proxy wallet и отправляет уведомления, пока unrealized profit ≥ заданного порога (по умолчанию 20%).

## Как это работает

1. **Data API** — каждые 30 с загружает позиции: `GET https://data-api.polymarket.com/positions?user=0x...`
2. **Market WebSocket** — подписка на цены всех токенов открытых позиций (`best_bid_ask`, `last_trade_price`)
3. **Profit monitor** — пересчитывает PnL при изменении цены; если profit ≥ порога, шлёт алерт (HTTP + Telegram) не чаще раза в 5 с на позицию

## Telegram-бот

Задайте токен в `.env` как `TELEGREM_BOT_API` или `TELEGRAM_BOT_API`.

1. Запустите приложение и напишите боту **`/start`** — чат подпишется на алерты.
2. Или укажите **`TELEGRAM_CHAT_ID`** (узнать у [@userinfobot](https://t.me/userinfobot)) — алерты сразу без `/start`.

| Кнопка / команда | Описание |
|------------------|----------|
| `/start` | Подписка и нижнее меню |
| `📊 Сделки` | Список открытых сделок с PnL |
| `📡 Статус` | WS, синхронизация, порог |
| `🔄 Обновить` | Загрузить с Polymarket API |
| `❓ Помощь` | Краткая справка |

Опционально: `TELEGRAM_ALLOWED_CHAT_IDS` — whitelist chat id через запятую.

## Адрес кошелька

Укажите адрес, по которому лежат открытые позиции:

- **`USER_ADDRESS`** — основной адрес из `.env`
- **`RELAYER_API_KEY_ADDRESS`** — fallback, если позиции на proxy/funder кошельке relayer
- **`POSITIONS_USER_ADDRESS`** — явный override, если позиции не на `USER_ADDRESS`

Если `/health` показывает `positionsCount: 0`, а сделки есть — попробуйте `POSITIONS_USER_ADDRESS` = proxy wallet из профиля Polymarket.

`RELAYER_API_KEY` + `RELAYER_API_KEY_ADDRESS` сохраняются в конфиге для будущих relayer-запросов; для публичного Data API они не обязательны.

## Установка

```bash
cp .env.example .env
# отредактируйте USER_ADDRESS (и при необходимости RELAYER_*)

npm install
npm run start:dev
```

## Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `USER_ADDRESS` | — | Адрес пользователя (один из адресов обязателен) |
| `RELAYER_API_KEY` | — | UUID ключа relayer (пара с `RELAYER_API_KEY_ADDRESS`) |
| `RELAYER_API_KEY_ADDRESS` | — | Адрес владельца relayer-ключа |
| `POSITIONS_USER_ADDRESS` | `USER_ADDRESS` → … | Явный адрес для `GET /positions` |
| `POLYMARKET_USER_ADDRESS` | — | Устаревший alias |
| `TELEGREM_BOT_API` / `TELEGRAM_BOT_API` | — | Токен бота от @BotFather |
| `TELEGRAM_CHAT_ID` | — | Фиксированный chat id для алертов |
| `TELEGRAM_ALLOWED_CHAT_IDS` | — | Whitelist chat id |
| `PROFIT_THRESHOLD_PERCENT` | `20` | Порог profit % |
| `NOTIFY_URL` | `https://notify.qwalex.one` | HTTP-уведомления |
| `NOTIFY_HTTP_ENABLED` | `true` | `false` — только Telegram |
| `NOTIFY_INTERVAL_MS` | `5000` | Минимальный интервал между алертами на одну позицию |
| `POSITIONS_POLL_INTERVAL_MS` | `30000` | Интервал синхронизации позиций |
| `PORT` | `3000` | HTTP-порт |

## Health check

```bash
curl http://localhost:3000/health
```

Ответ: `positionsCount`, `wsConnected`, `lastSyncAt`, список позиций с текущим PnL.

## Проверка уведомлений (dev)

Временно снизьте порог, например `PROFIT_THRESHOLD_PERCENT=0`, чтобы получать алерты по всем позициям в плюсе.

## Деплой на Railway

Подробная инструкция: [docs/RAILWAY.md](docs/RAILWAY.md).

Кратко:

1. Подключите GitHub-репозиторий к Railway.
2. Добавьте переменные окружения (`USER_ADDRESS`, `TELEGRAM_BOT_API`, `TELEGRAM_CHAT_ID`, …).
3. Деплой идёт через Dockerfile; health check — `/health`.
4. Держите **1 replica** (один процесс на токен Telegram-бота).

## Ограничения

- Новая сделка появится в мониторинге не позже чем через `POSITIONS_POLL_INTERVAL_MS`
- CLOB API keys не нужны (режим auto_all по адресу)
- PnL по WebSocket — оценка по mark price (`best_bid`); `avgPrice` обновляется при poll
- На Railway: один инстанс на один `TELEGRAM_BOT_API`
