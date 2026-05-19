# Деплой на Railway

## Быстрый старт

1. Создайте проект на [Railway](https://railway.com) → **New Project** → **Deploy from GitHub repo**.
2. Выберите репозиторий `polymarket-profit-watcher`.
3. Railway подхватит [`railway.toml`](../railway.toml) и соберёт образ из [`Dockerfile`](../Dockerfile).
4. В **Variables** добавьте переменные из [`.env.example`](../.env.example) (см. ниже).
5. После деплоя проверьте: `https://<ваш-домен>.up.railway.app/health`

## Обязательные переменные

| Переменная | Описание |
|------------|----------|
| `USER_ADDRESS` | Адрес с открытыми позициями (`0x…`) |
| `TELEGRAM_BOT_API` или `TELEGREM_BOT_API` | Токен бота |
| `TELEGRAM_CHAT_ID` | Chat id для алертов (рекомендуется на сервере) |

## Рекомендуемые

| Переменная | Значение |
|------------|----------|
| `PROFIT_THRESHOLD_PERCENT` | `20` |
| `NOTIFY_HTTP_ENABLED` | `true` или `false` |
| `NODE_ENV` | `production` |

`PORT` Railway задаёт автоматически — **не переопределяйте** без необходимости.

## Health check

- Путь: `/health`
- Корень `/` редиректит на `/health`

## Важно

- **Один инстанс**: Telegram long polling не поддерживает несколько реплик с одним токеном. В Railway оставьте **1 replica**.
- Секреты только в Railway Variables, не коммитьте `.env`.
- Логи: Railway → Deployments → View logs.

## Локальная проверка Docker-образа

```bash
docker build -t polymarket-profit-watcher .
docker run --rm -p 3000:3000 --env-file .env polymarket-profit-watcher
curl http://localhost:3000/health
```
