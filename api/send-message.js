const https = require('https');
const { checkRateLimit } = require('./_lib/rate-limit');

const SITE_ORIGIN = 'https://bizkitdigital.vercel.app';

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .substring(0, 1000);
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', SITE_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const { success } = await checkRateLimit(`lead:${ip}`, 5, '60 s');
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

    const { name, phone, telegram, email, message, source } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Missing or invalid name' });
    }
    if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid phone' });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        return res.status(400).json({ error: 'Invalid phone number' });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;

    if (!token || !chatId) {
        return res.status(500).json({ error: 'Telegram not configured' });
    }

    const src = escapeHtml(source) || 'Сайт';
    const text =
        '📩 ЗАЯВКА С САЙТА (' + src + ')\n\n' +
        '👤 Имя: ' + escapeHtml(name) + '\n' +
        '📱 Телефон: ' + escapeHtml(phone) + '\n' +
        '✈️ Telegram: ' + escapeHtml(telegram) + '\n' +
        '📧 Email: ' + escapeHtml(email) + '\n' +
        '💬 Сообщение: ' + escapeHtml(message);

    const payload = JSON.stringify({
        chat_id: chatId,
        text: text
    });

    try {
        const result = await new Promise((resolve, reject) => {
            const request = https.request({
                hostname: 'api.telegram.org',
                port: 443,
                path: '/bot' + token + '/sendMessage',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            }, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    try { resolve(JSON.parse(data)); }
                    catch (e) { resolve({ ok: false, error: data }); }
                });
            });
            request.on('error', reject);
            request.write(payload);
            request.end();
        });

        if (result.ok) {
            return res.status(200).json({ status: 'ok' });
        } else {
            return res.status(500).json({ error: 'Telegram error', details: result });
        }
    } catch (error) {
        return res.status(500).json({ error: String(error) });
    }
};
