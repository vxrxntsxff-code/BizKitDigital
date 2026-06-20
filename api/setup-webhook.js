const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = 'https://bizkitdigital.vercel.app/api/bot';
const SETUP_SECRET = process.env.SETUP_SECRET || 'bizkit-setup-2026';

module.exports = async (req, res) => {
    const secret = req.query.secret || (req.body && req.body.secret);
    if (secret !== SETUP_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (!BOT_TOKEN) {
        return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not set' });
    }

    try {
        const delResult = await tgApi('deleteWebhook');
        const setResult = await tgApi('setWebhook', {
            url: WEBHOOK_URL,
            allowed_updates: ['message', 'callback_query']
        });
        const info = await tgApi('getWebhookInfo');

        return res.status(200).json({
            delete: delResult,
            set: setResult,
            info: info
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

function tgApi(method, body = {}) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const request = https.request({
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${BOT_TOKEN}/${method}`,
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
        request.on('error', reject);
        request.write(payload);
        request.end();
    });
}
