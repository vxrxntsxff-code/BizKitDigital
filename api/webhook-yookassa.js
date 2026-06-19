const https = require('https');
const crypto = require('crypto');
const { checkRateLimit } = require('./_lib/rate-limit');

const MAX_BODY_SIZE = 1024 * 1024;

function sanitize(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, '').substring(0, 200);
}

function verifyWebhookSignature(req) {
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    if (!secretKey) return false;

    const signatureHeader = req.headers['authorization'];
    if (!signatureHeader) return false;

    const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(JSON.stringify(req.body))
        .digest('base64');

    const providedSignature = signatureHeader.replace('HmacSHA256 ', '');

    if (expectedSignature.length !== providedSignature.length) return false;

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(providedSignature)
    );
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const { success } = await checkRateLimit(`webhook:${ip}`, 20, '60 s');
    if (!success) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    let body = req.body;
    if (!body || typeof body === 'string') {
        try {
            const chunks = [];
            let totalSize = 0;
            for await (const chunk of req) {
                totalSize += chunk.length;
                if (totalSize > MAX_BODY_SIZE) {
                    return res.status(413).json({ error: 'Body too large' });
                }
                chunks.push(chunk);
            }
            body = JSON.parse(Buffer.concat(chunks).toString());
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON' });
        }
    }

    if (!verifyWebhookSignature(req)) {
        return res.status(403).json({ error: 'Invalid webhook signature' });
    }

    try {
        switch (body.event) {
            case 'payment.succeeded': {
                const payment = body.object;
                const meta = payment.metadata || {};
                const amount = payment.amount ? payment.amount.value : '?';
                const pkg = sanitize(meta.package) || 'неизвестен';
                const name = sanitize(meta.client_name) || 'не указано';
                const phone = sanitize(meta.client_phone) || 'не указан';
                const email = sanitize(meta.client_email) || 'не указан';
                const tg = sanitize(meta.client_telegram) || 'не указан';
                const method = meta.payment_method === 'sbp' ? 'СБП' : 'Карта';

                const msg =
                    `💰 ОПЛАТА ПРОШЛА УСПЕШНО\n\n` +
                    `📦 Пакет: ${pkg}\n` +
                    `💵 Сумма: ${amount} ₽\n\n` +
                    `👤 Имя: ${name}\n` +
                    `📱 Телефон: ${phone}\n` +
                    `📧 Email: ${email}\n` +
                    `✈️ Telegram: ${tg}\n` +
                    `💳 Способ: ${method}\n\n` +
                    `🆔 Платёж: ${payment.id}`;

                const result = await sendTelegram(msg);
                return res.status(200).json({ status: 'ok', telegram: result });
            }

            case 'payment.canceled': {
                const payment = body.object;
                const meta = payment.metadata || {};
                const msg =
                    `❌ ОПЛАТА ОТМЕНЕНА\n\n` +
                    `Пакет: ${sanitize(meta.package) || '?'}\n` +
                    `Имя: ${sanitize(meta.client_name) || '?'}\n` +
                    `🆔 Платёж: ${payment.id}`;
                await sendTelegram(msg);
                return res.status(200).json({ status: 'ok' });
            }

            default:
                return res.status(200).json({ status: 'ok', skipped: true });
        }
    } catch (error) {
        return res.status(500).json({ error: String(error) });
    }
};

function sendTelegram(text) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;

    if (!token || !chatId) {
        return Promise.resolve({ error: 'Telegram not configured' });
    }

    const payload = JSON.stringify({
        chat_id: chatId,
        text: text
    });

    return new Promise((resolve, reject) => {
        const request = https.request({
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/sendMessage`,
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
                catch (e) { resolve({ raw: data }); }
            });
        });
        request.on('error', (e) => resolve({ error: String(e) }));
        request.write(payload);
        request.end();
    });
}
