const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');

let ratelimit = null;

function getRatelimit() {
    if (ratelimit) return ratelimit;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        console.warn('Upstash Redis not configured, falling back to no rate limiting');
        return null;
    }

    const redis = new Redis({ url, token });

    ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '60 s'),
        analytics: true,
        prefix: 'bizkit',
    });

    return ratelimit;
}

async function checkRateLimit(ip, limit = 10, window = '60 s') {
    const rl = getRatelimit();
    if (!rl) return { success: true, remaining: 999 };

    const customRatelimit = new Ratelimit({
        redis: rl.redis,
        limiter: Ratelimit.slidingWindow(limit, window),
        analytics: true,
        prefix: 'bizkit',
    });

    return customRatelimit.limit(ip);
}

module.exports = { checkRateLimit };
