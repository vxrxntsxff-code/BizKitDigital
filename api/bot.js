const { Bot, InlineKeyboard } = require('grammy');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_ID;

if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
}

const bot = new Bot(BOT_TOKEN);
let botInitPromise = null;

const MENU_BUTTONS = ['📦 Тарифы', '🛠 Услуги', '❓ Как это работает', '💬 Задать вопрос', '📞 Контакты', '📋 Кейсы', '❓ Частые вопросы'];

const PACKAGES = {
    start: {
        name: 'Старт',
        price: '20 000 ₽',
        description: 'Для тех, кто хочет попробовать',
        features: [
            'Лендинг (до 3 экранов)',
            'Telegram-бот для записи',
            'Адаптивный дизайн',
            'Домен на 1 год',
        ],
        notIncluded: ['AI-чат на сайте', 'Интеграции с CRM'],
    },
    business: {
        name: 'Бизнес',
        price: '35 000 ₽',
        description: 'Оптимальный выбор для роста',
        popular: true,
        features: [
            'Лендинг (до 5 экранов)',
            'Telegram-бот для записи',
            'AI-чат на сайте',
            'Интеграция с Google Таблицами',
            'Домен на 1 год',
        ],
        notIncluded: ['Онлайн-оплата'],
    },
    premium: {
        name: 'Премиум',
        price: '50 000 ₽',
        description: 'Максимум возможностей',
        features: [
            'Лендинг (до 7 экранов)',
            'Telegram-бот для записи',
            'AI-чат на сайте',
            'Онлайн-оплата (ЮKassa)',
            'CRM-интеграция',
            '3 месяца поддержки',
        ],
        notIncluded: [],
    },
    custom: {
        name: 'Собери свой',
        price: 'от 20 000 ₽',
        description: 'Выбери только то, что нужно',
        features: [
            'Лендинг — от 14 000₽',
            'Telegram-бот — 12 000₽',
            'AI-чат — 10 000₽',
            'Онлайн-оплата — 12 000₽',
            'CRM-интеграция — 10 000₽',
            'Домен — 2 000₽',
        ],
        notIncluded: [],
    },
};

const CASES = [
    { name: 'Твой портной', type: 'ателье', icon: '✂️', result: '+40% записей через бота', desc: 'Клиенты записывались по телефону, терялись среди конкурентов в 2ГИС. Сделали лендинг + бот.' },
    { name: 'Счастливый хвост', type: 'ветклиника', icon: '🐾', result: '-60% звонков на ресепшен', desc: 'Звонки отвлекали врачей. AI-чат берёт вопросы, бот записывает.' },
    { name: 'Маникюрная N1', type: 'салон красоты', icon: '💅', result: 'Экономия 8 000₽/мес', desc: 'Заменили кривой YClients на нашего бота. Оплата картой в Telegram.' },
];

const SUPPORT_INFO = {
    price: 'от 1 500 ₽/мес',
    features: [
        'Исправление багов после запуска',
        'Обновление текстов и фото на сайте',
        'Мелкие правки дизайна (до 2ч/мес)',
        'Поддержание SSL и работоспособности',
        'Uptime-мониторинг',
        'Консультации',
    ],
};

function mainKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                [{ text: '📦 Тарифы' }, { text: '🛠 Услуги' }],
                [{ text: '📋 Кейсы' }, { text: '❓ Частые вопросы' }],
                [{ text: '💬 Задать вопрос' }, { text: '📞 Контакты' }],
            ],
            resize_keyboard: true,
        },
    };
}

function servicesInlineKB() {
    return new InlineKeyboard()
        .text('Старт — 20 000 ₽', 'svc_start')
        .row()
        .text('Бизнес — 35 000 ₽ ⭐', 'svc_business')
        .row()
        .text('Премиум — 50 000 ₽', 'svc_premium')
        .row()
        .text('Собрать свой тариф', 'svc_custom')
        .row()
        .text('Техподдержка', 'svc_support');
}

function orderKeyboard(pkgKey) {
    return new InlineKeyboard()
        .url('🛒 Заказать', 'https://bizkitdigital.vercel.app/#pricing')
        .row()
        .url('💬 Написать Диме', 'https://t.me/vxrxntsxff')
        .row()
        .text('← Назад к тарифам', 'back_to_services');
}

function packagesKeyboard() {
    return new InlineKeyboard()
        .text('Старт — 20 000 ₽', 'pkg_start')
        .text('Бизнес — 35 000 ₽ ⭐', 'pkg_business')
        .row()
        .text('Премиум — 50 000 ₽', 'pkg_premium')
        .text('Техподдержка', 'pkg_support');
}

function packagesInlineKB() {
    return new InlineKeyboard()
        .text('Старт — 20 000 ₽', 'pkg_start')
        .row()
        .text('Бизнес — 35 000 ₽ ⭐', 'pkg_business')
        .row()
        .text('Премиум — 50 000 ₽', 'pkg_premium')
        .row()
        .text('Собрать свой тариф', 'pkg_custom')
        .row()
        .text('Техподдержка', 'pkg_support');
}

function formatPackage(pkg) {
    let text = `📦 Пакет «${pkg.name}»${pkg.popular ? ' ⭐' : ''}\n\n`;
    text += `Цена: ${pkg.price} (разовый)\n`;
    text += `${pkg.description}\n\n`;
    text += 'Что входит:\n';
    for (const f of pkg.features) text += `  ✓ ${f}\n`;
    if (pkg.notIncluded && pkg.notIncluded.length) {
        text += '\nНе входит:\n';
        for (const f of pkg.notIncluded) text += `  ✕ ${f}\n`;
    }
    return text;
}

// /start with deep link
bot.command('start', async (ctx) => {
    const deepLink = ctx.match;
    if (deepLink && PACKAGES[deepLink]) {
        const text = formatPackage(PACKAGES[deepLink]);
        await ctx.reply(text, { reply_markup: orderKeyboard(deepLink) });
        return;
    }
    await ctx.reply(
        '👋 Привет! Я бот BizkitDigital.\n\n' +
        'Мы создаём цифровые пакеты для бизнеса:\n' +
        'сайты, Telegram-боты, AI-чаты и интеграции.\n\n' +
        'Выберите действие:',
        mainKeyboard()
    );
});

bot.command('ver', async (ctx) => {
    await ctx.reply('v2.1 — inline buttons in tariffs');
});

bot.command('help', async (ctx) => {
    await ctx.reply(
        'ℹ️ Помощь:\n\n' +
        '📦 Тарифы — выбрать пакет\n' +
        '🛠 Услуги — что входит + заказ\n' +
        '📋 Кейсы — наши проекты\n' +
        '❓ Частые вопросы\n' +
        '💬 Задать вопрос — связаться\n' +
        '📞 Контакты — реквизиты'
    );
});

bot.hears('📦 Тарифы', async (ctx) => {
    let text = '📦 Наши тарифы (v2.1):\n\n';
    for (const [key, pkg] of Object.entries(PACKAGES)) {
        if (key === 'custom') continue;
        const popular = pkg.popular ? ' ⭐ Популярный' : '';
        text += `▪️ «${pkg.name}» — ${pkg.price}${popular}\n   ${pkg.description}\n\n`;
    }
    text += `▪️ «Собрать свой» — от 20 000₽\n   Выбери только то, что нужно\n\n`;
    text += 'Поддержка: от 1 500 ₽/мес\n\n';
    text += 'Выберите тариф чтобы узнать подробности:';
    await ctx.reply(text, { reply_markup: packagesInlineKB() });
});

bot.hears('🛠 Услуги', async (ctx) => {
    await ctx.reply(
        '🛠 Что мы делаем:\n\n' +
        '🌐 Лендинги и сайты-визитки — от 14 000₽\n' +
        '🤖 Telegram-боты для записи 24/7 — 12 000₽\n' +
        '💬 AI-чат на сайте — 10 000₽\n' +
        '⚙️ Интеграции: CRM, Google Таблицы — 10 000₽\n' +
        '💳 Онлайн-оплата (ЮKassa) — 12 000₽\n' +
        '🛠 Поддержка — от 1 500₽/мес\n\n' +
        '💡 Нужен весь функционал? Лучше взять пакет!\n' +
        'Нажмите 📦 Тарифы чтобы выбрать пакет.'
    );
});

bot.hears('❓ Как это работает', async (ctx) => {
    await ctx.reply(
        '❓ Как мы работаем:\n\n' +
        '1️⃣ Знакомство — обсуждаем бизнес и задачи\n' +
        '2️⃣ Разработка — делаем пакет за 2-3 дня\n' +
        '3️⃣ Запуск — подключаем, тестируем, обучаем\n' +
        '4️⃣ Поддержка — помогаем каждый месяц\n\n' +
        '💰 Оплата полная через ЮKassa\n' +
        '🔒 Гарантия: возврат 100% если не понравится'
    );
});

bot.hears('📋 Кейсы', async (ctx) => {
    let text = '📋 Наши проекты:\n\n';
    for (const c of CASES) {
        text += `${c.icon} «${c.name}» (${c.type})\n   ${c.desc}\n   Результат: ${c.result}\n\n`;
    }
    text += 'Больше: bizkitdigital.vercel.app/cases.html';
    await ctx.reply(text);
});

bot.hears('❓ Частые вопросы', async (ctx) => {
    await ctx.reply(
        '❓ Частые вопросы:\n\n' +
        '💳 Оплата: полная через ЮKassa (карты, СБП)\n' +
        '⏰ Сроки: 2-3 рабочих дня\n' +
        '🔄 Возврат: 100% если не понравится\n' +
        '🌐 Домен: на 1 год в комплекте\n' +
        '🛠 Поддержка: от 1 500₽/мес\n\n' +
        'Не нашли ответ? Напишите нам!'
    );
});

bot.hears('📞 Контакты', async (ctx) => {
    await ctx.reply(
        '📞 Контакты:\n\n' +
        '💬 Telegram: @vxrxntsxff\n' +
        '📱 Телефон: +7 (951) 592-26-18\n' +
        '📧 Email: dimalengardt87@gmail.com\n' +
        '🌐 Сайт: bizkitdigital.vercel.app\n\n' +
        'Ленгардт Дмитрий Евгеньевич\n' +
        'Самозанятый (НПД) | ИНН: 420544798477'
    );
});

bot.hears('💬 Задать вопрос', async (ctx) => {
    await ctx.reply(
        '💬 Напишите ваш вопрос, и мы ответим.\n\n' +
        'Или свяжитесь напрямую:\n' +
        '📱 +7 (951) 592-26-18\n' +
        '💬 @vxrxntsxff'
    );
});

// === Inline callbacks: services menu ===
bot.callbackQuery('svc_start', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(formatPackage(PACKAGES.start) + '\n🛒 Чтобы заказать:', { reply_markup: orderKeyboard('start') });
    } catch (e) {}
});

bot.callbackQuery('svc_business', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(formatPackage(PACKAGES.business) + '\n🛒 Чтобы заказать:', { reply_markup: orderKeyboard('business') });
    } catch (e) {}
});

bot.callbackQuery('svc_premium', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(formatPackage(PACKAGES.premium) + '\n🛒 Чтобы заказать:', { reply_markup: orderKeyboard('premium') });
    } catch (e) {}
});

bot.callbackQuery('svc_custom', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        const text =
            '🔧 Собрать свой тариф\n\n' +
            'Выберите только то, что нужно:\n\n' +
            '  Лендинг — от 14 000₽\n' +
            '  Telegram-бот — 12 000₽\n' +
            '  AI-чат — 10 000₽\n' +
            '  Онлайн-оплата — 12 000₽\n' +
            '  CRM-интеграция — 10 000₽\n' +
            '  Домен — 2 000₽\n\n' +
            '💡 Если нужен весь функционал — дешевле взять пакет «Премиум» за 50 000₽\n\n' +
            '🛒 Чтобы заказать:';
        await ctx.editMessageText(text, { reply_markup: orderKeyboard('custom') });
    } catch (e) {}
});

bot.callbackQuery('svc_support', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        let text = '🛠 Техническая поддержка\n\n';
        text += `Цена: ${SUPPORT_INFO.price}\n\n`;
        text += 'Что входит:\n';
        for (const f of SUPPORT_INFO.features) text += `  ✓ ${f}\n`;
        text += '\nОплата ежемесячно. Отказ — в любой момент.';
        text += '\n\n🛒 Чтобы подключить:';
        await ctx.editMessageText(text, { reply_markup: orderKeyboard('support') });
    } catch (e) {}
});

bot.callbackQuery('back_to_services', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        let text = '📦 Наши тарифы:\n\n';
        for (const [key, pkg] of Object.entries(PACKAGES)) {
            if (key === 'custom') continue;
            const popular = pkg.popular ? ' ⭐ Популярный' : '';
            text += `▪️ «${pkg.name}» — ${pkg.price}${popular}\n   ${pkg.description}\n\n`;
        }
        text += `▪️ «Собрать свой» — от 20 000₽\n   Выбери только то, что нужно\n\n`;
        text += 'Подробнее — выберите:';
        await ctx.editMessageText(text, { reply_markup: packagesInlineKB() });
    } catch (e) {}
});

// === Inline callbacks: packages menu (from 📦 Тарифы) ===
bot.callbackQuery('pkg_start', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(formatPackage(PACKAGES.start) + '\n🛒 Чтобы заказать:', { reply_markup: orderKeyboard('start') });
    } catch (e) {}
});

bot.callbackQuery('pkg_business', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(formatPackage(PACKAGES.business) + '\n🛒 Чтобы заказать:', { reply_markup: orderKeyboard('business') });
    } catch (e) {}
});

bot.callbackQuery('pkg_premium', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(formatPackage(PACKAGES.premium) + '\n🛒 Чтобы заказать:', { reply_markup: orderKeyboard('premium') });
    } catch (e) {}
});

bot.callbackQuery('pkg_custom', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        const text =
            '🔧 Собрать свой тариф\n\n' +
            'Выберите только то, что нужно:\n\n' +
            '  Лендинг — от 14 000₽\n' +
            '  Telegram-бот — 12 000₽\n' +
            '  AI-чат — 10 000₽\n' +
            '  Онлайн-оплата — 12 000₽\n' +
            '  CRM-интеграция — 10 000₽\n' +
            '  Домен — 2 000₽\n\n' +
            '💡 Если нужен весь функционал — дешевле взять «Премиум» за 50 000₽\n\n' +
            '🛒 Чтобы заказать:';
        await ctx.editMessageText(text, { reply_markup: orderKeyboard('custom') });
    } catch (e) {}
});

bot.callbackQuery('pkg_support', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        let text = '🛠 Техническая поддержка\n\n';
        text += `Цена: ${SUPPORT_INFO.price}\n\n`;
        text += 'Что входит:\n';
        for (const f of SUPPORT_INFO.features) text += `  ✓ ${f}\n`;
        text += '\nОплата ежемесячно. Отказ — в любой момент.';
        text += '\n\n🛒 Чтобы подключить:';
        await ctx.editMessageText(text, { reply_markup: orderKeyboard('support') });
    } catch (e) {}
});

bot.callbackQuery('back_to_packages', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        let text = '📦 Наши тарифы:\n\n';
        for (const [key, pkg] of Object.entries(PACKAGES)) {
            if (key === 'custom') continue;
            const popular = pkg.popular ? ' ⭐ Популярный' : '';
            text += `▪️ «${pkg.name}» — ${pkg.price}${popular}\n   ${pkg.description}\n\n`;
        }
        text += `▪️ «Собрать свой» — от 20 000₽\n   Выбери только то, что нужно\n\n`;
        text += 'Подробнее — выберите:';
        await ctx.editMessageText(text, { reply_markup: packagesKeyboard() });
    } catch (e) {}
});

// Forward only non-menu text messages to owner
bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    if (MENU_BUTTONS.includes(text)) return;
    if (text && text.startsWith('/')) return;

    if (OWNER_CHAT_ID) {
        try {
            const user = ctx.from;
            await ctx.api.sendMessage(
                OWNER_CHAT_ID,
                '📩 Новое сообщение от клиента:\n\n' +
                `От: @${user.username || user.first_name} (ID: ${user.id})\n` +
                `Имя: ${user.first_name} ${user.last_name || ''}\n\n` +
                `Сообщение: ${text}`
            );
        } catch (e) {
            console.error('Forward error:', e);
        }
    }
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(200).json({ ok: true, message: 'Bot webhook is running' });
    }
    try {
        if (!botInitPromise) botInitPromise = bot.init();
        await botInitPromise;
        await bot.handleUpdate(req.body);
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Bot error:', error);
        return res.status(200).json({ ok: true });
    }
};
