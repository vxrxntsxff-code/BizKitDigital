const { checkRateLimit } = require('./_lib/rate-limit');

const SITE_ORIGIN = 'https://bizkitdigital.vercel.app';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', SITE_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const { success, remaining } = await checkRateLimit(`chat:${ip}`, 10, '60 s');
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

    const systemMsg = {
        role: 'system',
        content: 'Ты — AI-помощник компании BizkitDigital (Кемерово). Компания делает цифровые решения для малого бизнеса. Услуги: лендинги, Telegram-боты для записи клиентов, AI-чат на сайте, онлайн-оплата (ЮKassa), интеграции с CRM и Google Таблицами. Пакеты: "Старт" — 20 000₽ (лендинг до 3 экранов, бот, домен), "Бизнес" — 35 000₽ (лендинг до 5 экранов, бот, AI-чат, Google Таблицы, домен), "Премиум" — 50 000₽ (лендинг до 7 экранов, бот, AI-чат, оплата, CRM, 3 мес поддержки). Поддержка: 1 500₽/мес. Сроки: 2-3 рабочих дня. Оплата: 50/50 (предоплата + после сдачи). Возврат: 100% предоплаты если не понравится. ИНН: 420544798477 (самозанятый, НПД). ФИО: Ленгардт Дмитрий Евгеньевич. Контакты: Telegram @vxrxntsxff (лично), Telegram @BizkitDigital_bot (бот), тел +7(951)5922618, email dimalengardt87@gmail.com. Город: Кемерово. Отвечай кратко (2-4 предложения), дружелюбно, на русском. Не придумывай информацию, которой нет в промпте.'
    };

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
                max_tokens: 300,
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
