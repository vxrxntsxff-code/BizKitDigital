# Настройка Telegram-бота (Vercel webhook)

## 1) Подготовьте переменные окружения

### Обязательные переменные:
- `TELEGRAM_BOT_TOKEN` — токен бота от @BotFather
- `TELEGRAM_OWNER_ID` — ваш Telegram user ID (для пересылки сообщений)
- `TELEGRAM_GROUP_CHAT_ID` — ID группы/чата для уведомлений

### Для AI-чата:
- `OPENROUTER_KEY` — API-ключ OpenRouter

### Для оплаты:
- `YOOKASSA_SHOP_ID` — ID магазина в ЮKassa
- `YOOKASSA_SECRET_KEY` — секретный ключ ЮKassa

### Для Rate Limiting (рекомендуется):
- `UPSTASH_REDIS_REST_URL` — URL Upstash Redis
- `UPSTASH_REDIS_REST_TOKEN` — токен Upstash Redis

## 2) Деплой на Vercel

1. Задеплойте проект как обычно.
2. В настройках проекта на Vercel добавьте env-переменные (Production).

## 3) Установите webhook Telegram

Webhook endpoint:
- `https://bizkitdigital.vercel.app/api/bot`

В BotFather установите webhook на этот URL:
```
/setwebhook
https://bizkitdigital.vercel.app/api/bot
```

## 4) Как получить Telegram user ID

1. Напишите боту @userinfobot
2. Он пришлёт ваш ID
