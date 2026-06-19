const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = 'https://bizkitdigital.vercel.app/api/bot';

module.exports = async (req, res) => {

    if (!BOT_TOKEN) {
        return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not set' });
    }

    try {
        // Step 1: Delete old webhook
        const delResult = await tgApi('deleteWebhook');
        // Step 2: Set new webhook
        const setResult = await tgApi('setWebhook', { url: WEBHOOK_URL });
        // Step 3: Verify
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
