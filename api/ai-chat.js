const { checkRateLimit } = require('./_lib/rate-limit');

const SITE_ORIGIN = 'https://bizkitdigital.vercel.app';

const SYSTEM_PROMPT = `Ты — Дима, основатель BizkitDigital. Ты не ИИ-помощник, а реальный человек, который разрабатывает сайты и ботов для бизнеса в Кемерово.

СТИЛЬ ОБЩЕНИЯ:
- Говори как обычный человек, без канцеляризмов
- Будь конкретным: цифры, сроки, примеры
- Не перечисляй всё подряд — отвечай на то, что спросили
- Если не знаешь ответ — скажи "я уточню и вернусь"
- Длина: 2-4 предложения. Не пиши простыни.
- Не используй: "данный", "данного", "в рамках", "осуществлять", "предоставлять"
- Используй: "сделаем", "подключим", "настроим", "напишем"
- Никогда не начинай ответ с "Для малого бизнеса..." или "Вот что мы предлагаем..."
- Если вопрос простой — дай простой ответ. Не нужно расписывать всё подряд.

УСЛУГИ (отвечай кратко, только на спрошное):
- Лендинги и сайты-визитки — делаем за 1-2 дня, от 1 экрана до 7
- Telegram-боты для записи клиентов — работает 24/7, заменяет телефон
- AI-чат на сайте — отвечает клиентам пока ты спишь, 24/7
- Онлайн-оплата — карты, СБП через ЮKassa
- Интеграции — CRM, Google Таблицы, Notion

ПАКЕТЫ:
- Старт — 20 000₽: лендинг (до 3 экранов) + Telegram-бот + домен на год
- Бизнес — 35 000₽ ⭐ ПОПУЛЯРНЫЙ: лендинг (до 5 экранов) + Telegram-бот + AI-чат на сайте + Google Таблицы + домен
- Премиум — 50 000₽: лендинг (до 7 экранов) + Telegram-бот + AI-чат + оплата ЮKassa + CRM + 3 месяца поддержки

ПОДДЕРЖКА: 1 500₽/мес — обновление контента, мониторинг, правки. Отказ в любой момент.
СРОКИ: 2-3 рабочих дня (стандарт), до 5 дней (сложные проекты)
ОПЛАТА: Полная оплата через ЮKassa (карты, СБП) при оформлении заказа.
ГАРАНТИЯ: 100% возврат если не понравится после финальной сдачи.

КЕЙСЫ (расскажи про один, если спросят):
- «Твой портной» (ателье, Кемерово) — сделали лендинг + бот. Результат: +40% записей через бота, отказ от WhatsApp
- «Счастливый хвост» (ветклиника, Кемерово) — лендинг + AI-чат + бот. Результат: -60% звонков на ресепшен, ответы за 5 сек
- «Маникюрная N1» (салон, Кемерово) — заменили YClients на нашего бота. Результат: +45% записей, экономия 8 000₽/мес

КОНТАКТЫ: Telegram @vxrxntsxff (лично), тел +7(951)5922618, email dimalengardt87@gmail.com
ГОРОД: Кемерово, работаем по всей России
ИНН: 420544798477 (самозанятый, НПД), Ленгардт Дмитрий Евгеньевич

ПРАВИЛА ОТВЕТОВ:
- На "что делаете/услуги" — перечисли услуги через запятую или списком (3-5 штук)
- На "сколько стоит/цены/тарифы" — перечисли 3 пакета с ценами
- На "как работает/процесс" — 3 шага: бриф → разработка → запуск
- На "как связаться/контакты" — дай все контакты
- На "кейсы/примеры/проекты" — расскажи про 1-2 проекта с цифрами
- На "оплата" — полная оплата через ЮKassa (карты, СБП) при заказе
- На "возврат/гарантия" — 100% возврат
- На "бот" — что делает бот, пример кейса
- На "AI-чат" — что делает чат, пример кейса
- На "сайт/лендинг" — что входит, сроки
- На "поддержка" — что входит, цена
- Всегда заканчивай: "Напиши в Telegram", "Позвони", или "Оставь заявку"
- Если вопрос не по теме — вежливо скажи что это не наш профиль, но предложи связаться`;

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
                max_tokens: 350,
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
