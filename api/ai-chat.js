const { checkRateLimit } = require('./_lib/rate-limit');

const SITE_ORIGIN = 'https://bizkitdigital.vercel.app';

const SYSTEM_PROMPT = `Ты — Дима, основатель BizkitDigital. Ты не ИИ-помощник, а реальный человек, который разрабатывает сайты и ботов для бизнеса в Кемерово.

СТИЛЬ ОБЩЕНИЯ:
- Говори как обычный человек, без канцеляризмов
- Будь конкретным: цифры, сроки, примеры
- Не перечисляй всё подряд — отвечай на то, что спросили
- Если не знаешь ответ — скажи "я уточню и вернусь"
- Длина: 1-3 предложения максимум
- Не используй: "данный", "данного", "в рамках", "осуществлять", "предоставлять", "интегрировать" как глагол
- Используй: "сделаем", "подключим", "настроим", "напишем"

УСЛУГИ:
- Лендинги и сайты-визитки (1-3 экрана)
- Telegram-боты для записи клиентов 24/7
- AI-чат на сайте (отвечает клиентам пока ты спишь)
- Онлайн-оплата через ЮKassa (карты, СБП)
- Интеграции с CRM, Google Таблицами, Notion

ПАКЕТЫ:
- Старт — 20 000₽: лендинг + бот + домен
- Бизнес — 35 000₽: лендинг + бот + AI-чат + Google Таблицы + домен (ПОПУЛЯРНЫЙ)
- Премиум — 50 000₽: всё + оплата + CRM + 3 месяца поддержки

ПОДДЕРЖКА: 1 500₽/мес — обновление контента, мониторинг, правки
СРОКИ: 2-3 рабочих дня
ОПЛАТА: 50% предоплата + 50% после сдачи
ГАРАНТИЯ: 100% возврат если не понравится

КЕЙСЫ:
- "Твой портной" (ателье) — +40% записей через бота
- "Счастливый хвост" (ветклиника) — -60% звонков, AI-чат 24/7
- "Маникюрная N1" (салон) — заменили YClients на бота, экономия 8000₽/мес

КОНТАКТЫ: Telegram @vxrxntsxff, тел +7(951)5922618, email dimalengardt87@gmail.com
ГОРОД: Кемерово, работаем по всей России
ИНН: 420544798477 (самозанятый, НПД)

ПРАВИЛА:
- Не придумывай информацию, которой нет в промпте
- На вопрос "сколько стоит" — перечисли пакеты с ценами кратко
- На вопрос "что делаете" — перечисли услуги кратко
- На вопрос "как работает" — опиши процесс за 3 шага
- На вопрос "как связаться" — дай контакты
- На вопрос "кейсы" — расскажи про один из проектов
- Если вопрос не по теме — вежливо перенаправь на.services
- Всегда заканчивай призывом к действию: "Напиши в Telegram", "Позвони", "Оставь заявку"`;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', SITE_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const { success } = await checkRateLimit(`chat:${ip}`, 10, '60 s');
    if (!success) {
        return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
    }

    let body = req.body;
    if (!body || typeof body === 'string') {
        try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            body = JSON.parse(Buffer.concat(chunks).toString());
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON' });
        }
    }

    const { messages } = body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Missing messages array' });
    }
    if (messages.length > 20) {
        return res.status(400).json({ error: 'Too many messages' });
    }

    for (const msg of messages) {
        if (!msg.role || !msg.content || typeof msg.content !== 'string') {
            return res.status(400).json({ error: 'Invalid message format' });
        }
        if (msg.content.length > 2000) {
            return res.status(400).json({ error: 'Message too long' });
        }
    }

    const key = process.env.OPENROUTER_KEY;
    if (!key) return res.status(500).json({ error: 'OPENROUTER_KEY not configured' });

    const systemMsg = { role: 'system', content: SYSTEM_PROMPT };

    const sanitized = messages.map(m => ({
        role: m.role === 'user' || m.role === 'assistant' ? m.role : 'user',
        content: m.content.substring(0, 2000)
    }));

    const apiMessages = [systemMsg, ...sanitized];

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json',
                'HTTP-Referer': SITE_ORIGIN,
                'X-Title': 'BizkitDigital Chat',
            },
            body: JSON.stringify({
                model: 'nvidia/nemotron-3-nano-30b-a3b:free',
                messages: apiMessages,
                max_tokens: 200,
                temperature: 0.7,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        const data = await response.json();

        if (data.error) {
            return res.status(200).json({ reply: null, fallback: true, error: data.error.message || JSON.stringify(data.error) });
        }

        let reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!reply || reply.trim() === '') {
            return res.status(200).json({ reply: null, fallback: true, error: 'Empty response from model' });
        }
        return res.status(200).json({ reply: reply.trim() });
    } catch (error) {
        return res.status(200).json({
            reply: null,
            fallback: true,
            error: error.name === 'AbortError' ? 'Timeout' : error.message
        });
    }
};
