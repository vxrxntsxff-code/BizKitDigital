const https = require('https');
const crypto = require('crypto');
const { checkRateLimit } = require('./_lib/rate-limit');

const SITE_ORIGIN = 'https://bizkitdigital.vercel.app';

const VALID_AMOUNTS = [20000, 35000, 50000];
const MAX_BODY_SIZE = 1024 * 1024;

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
    const { success } = await checkRateLimit(`pay:${ip}`, 5, '60 s');
    if (!success) {
        return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
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
            const raw = Buffer.concat(chunks).toString();
            body = JSON.parse(raw);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const { amount, description, return_url, metadata } = body;

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    if (!VALID_AMOUNTS.includes(numAmount)) {
        return res.status(400).json({ error: 'Invalid package amount' });
    }
    if (!description || typeof description !== 'string' || description.length > 500) {
        return res.status(400).json({ error: 'Invalid description' });
    }

    let safeReturnUrl = SITE_ORIGIN + '/success.html';
    if (return_url && typeof return_url === 'string') {
        try {
            const parsed = new URL(return_url);
            if (parsed.hostname === 'bizkitdigital.vercel.app') {
                safeReturnUrl = return_url;
            }
        } catch (e) {
            // invalid URL, use default
        }
    }

    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;

    if (!shopId || !secretKey) {
        return res.status(500).json({ error: 'Payment not configured' });
    }

    try {
        const idempotenceKey = crypto.randomUUID();

        const payload = JSON.stringify({
            amount: { value: numAmount.toFixed(2), currency: 'RUB' },
            confirmation: { type: 'redirect', return_url: safeReturnUrl },
            capture: true,
            description,
            metadata: metadata || {}
        });

        const result = await new Promise((resolve, reject) => {
            const request = https.request({
                hostname: 'api.yookassa.ru',
                port: 443,
                path: '/v3/payments',
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64'),
                    'Content-Type': 'application/json',
                    'Idempotence-Key': idempotenceKey
                }
            }, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Invalid JSON response: ' + data));
                    }
                });
            });

            request.on('error', reject);
            request.write(payload);
            request.end();
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({ error: 'Payment creation failed', details: error.message });
    }
};
