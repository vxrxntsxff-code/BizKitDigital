const { Bot, InlineKeyboard } = require('grammy');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_ID;

if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
}

const bot = new Bot(BOT_TOKEN);
let botInitPromise = null;

// Menu buttons that should NOT be forwarded to owner
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

function packagesKeyboard() {
    return new InlineKeyboard()
        .text('Старт — 20 000 ₽', 'pkg_start')
        .text('Бизнес — 35 000 ₽ ⭐', 'pkg_business')
        .row()
        .text('Премиум — 50 000 ₽', 'pkg_premium')
        .text('Техподдержка', 'pkg_support');
}

// /start with deep link support
bot.command('start', async (ctx) => {
    const deepLink = ctx.match;
    if (deepLink) {
        const pkg = PACKAGES[deepLink];
        if (pkg) {
            const text = formatPackage(pkg);
            const kb = new InlineKeyboard()
                .text('Написать Диме', { url: 'https://t.me/vxrxntsxff' })
                .row()
                .text('← Все тарифы', 'back_to_packages');
            await ctx.reply(text, { reply_markup: kb.reply_markup });
            return;
        }
    }
    const welcome =
        '👋 Привет! Я бот BizkitDigital.\n\n' +
        'Мы создаём цифровые пакеты для бизнеса:\n' +
        'сайты, Telegram-боты, AI-чаты и интеграции.\n\n' +
        'Выберите действие:';
    await ctx.reply(welcome, mainKeyboard());
});

bot.command('help', async (ctx) => {
    const text =
        'ℹ️ Помощь:\n\n' +
        'Используйте кнопки внизу экрана:\n' +
        '📦 Тарифы — подробнее о пакетах\n' +
        '🛠 Услуги — что мы делаем\n' +
        '📋 Кейсы — наши проекты\n' +
        '❓ Частые вопросы — ответы на вопросы\n' +
        '💬 Задать вопрос — связаться с нами\n' +
        '📞 Контакты — наши реквизиты\n\n' +
        'Или просто напишите сообщение — мы ответим!';
    await ctx.reply(text);
});

bot.hears('📦 Тарифы', async (ctx) => {
    let text = '📦 Наши тарифы:\n\n';
    for (const [key, pkg] of Object.entries(PACKAGES)) {
        const popular = pkg.popular ? ' ⭐ Популярный' : '';
        text += `▪️ «${pkg.name}» — ${pkg.price}${popular}\n`;
        text += `   ${pkg.description}\n\n`;
    }
    text += 'Поддержка после запуска: от 1 500 ₽/мес\n\n';
    text += 'Подробнее — выберите тариф:';
    await ctx.reply(text, { reply_markup: packagesKeyboard().reply_markup });
});

bot.hears('🛠 Услуги', async (ctx) => {
    const text =
        '🛠 Что мы делаем:\n\n' +
        '🌐 Лендинги и сайты-визитки\n' +
        '   Адаптивные сайты под ваш бизнес за 1-3 дня\n\n' +
        '🤖 Telegram-боты\n' +
        '   Автоматическая запись клиентов 24/7\n\n' +
        '💬 AI-чат на сайте\n' +
        '   Отвечает клиентам, пока вы работаете\n\n' +
        '⚙️ Интеграции\n' +
        '   CRM, Google Таблицы, ЮKassa\n\n' +
        '🛠 Поддержка\n' +
        '   Обновления и правки после запуска';
    await ctx.reply(text);
});

bot.hears('❓ Как это работает', async (ctx) => {
    const text =
        '❓ Как мы работаем:\n\n' +
        '1️⃣ Знакомство\n' +
        '   Обсуждаем ваш бизнес и задачи\n\n' +
        '2️⃣ Разработка\n' +
        '   Делаем пакет за 2-3 дня\n\n' +
        '3️⃣ Запуск\n' +
        '   Подключаем, тестируем, обучаем\n\n' +
        '4️⃣ Поддержка\n' +
        '   Помогаем каждый месяц на подписке\n\n' +
        '💰 Оплата: полная через ЮKassa при заказе\n' +
        '🔒 Гарантия: возврат 100% если не понравится';
    await ctx.reply(text);
});

bot.hears('📋 Кейсы', async (ctx) => {
    let text = '📋 Наши проекты:\n\n';
    for (const c of CASES) {
        text += `${c.icon} «${c.name}» (${c.type})\n`;
        text += `   ${c.desc}\n`;
        text += `   Результат: ${c.result}\n\n`;
    }
    text += 'Больше на сайте: bizkitdigital.vercel.app/cases.html';
    await ctx.reply(text);
});

bot.hears('❓ Частые вопросы', async (ctx) => {
    const text =
        '❓ Частые вопросы:\n\n' +
        '💳 Оплата: полная через ЮKassa (карты, СБП)\n\n' +
        '⏰ Сроки: 2-3 рабочих дня\n\n' +
        '🔄 Возврат: 100% если не понравится\n\n' +
        '🌐 Домен: на 1 год в комплекте\n\n' +
        '🛠 Поддержка: от 1 500₽/мес\n\n' +
        '📞 Контакты: @vxrxntsxff | +7(951)592-26-18\n\n' +
        'Не нашли ответ? Напишите нам!';
    await ctx.reply(text);
});

bot.hears('📞 Контакты', async (ctx) => {
    const text =
        '📞 Контакты:\n\n' +
        '💬 Telegram: @vxrxntsxff\n' +
        '📱 Телефон: +7 (951) 592-26-18\n' +
        '📧 Email: dimalengardt87@gmail.com\n\n' +
        '🌐 Сайт: bizkitdigital.vercel.app\n\n' +
        'Ленгардт Дмитрий Евгеньевич\n' +
        'Самозанятый (НПД)\n' +
        'ИНН: 420544798477';
    await ctx.reply(text);
});

bot.hears('💬 Задать вопрос', async (ctx) => {
    const text =
        '💬 Напишите ваш вопрос, и мы ответим.\n\n' +
        'Или свяжитесь напрямую:\n' +
        '📱 +7 (951) 592-26-18\n' +
        '💬 @vxrxntsxff';
    await ctx.reply(text);
});

function formatPackage(pkg) {
    let text = `📦 Пакет «${pkg.name}»${pkg.popular ? ' ⭐' : ''}\n\n`;
    text += `Цена: ${pkg.price} (разовый)\n`;
    text += `${pkg.description}\n\n`;
    text += 'Что входит:\n';
    for (const f of pkg.features) text += `  ✓ ${f}\n`;
    if (pkg.notIncluded.length) {
        text += '\nНе входит:\n';
        for (const f of pkg.notIncluded) text += `  ✕ ${f}\n`;
    }
    return text;
}

bot.callbackQuery('pkg_start', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        const text = formatPackage(PACKAGES.start) + '\n💬 Чтобы обсудить заказ, напишите нам:';
        const kb = new InlineKeyboard()
            .text('Написать Диме', { url: 'https://t.me/vxrxntsxff' })
            .row()
            .text('← Назад к тарифам', 'back_to_packages');
        await ctx.editMessageText(text, { reply_markup: kb.reply_markup });
    } catch (e) { /* message too old */ }
});

bot.callbackQuery('pkg_business', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        const text = formatPackage(PACKAGES.business) + '\n💬 Чтобы обсудить заказ, напишите нам:';
        const kb = new InlineKeyboard()
            .text('Написать Диме', { url: 'https://t.me/vxrxntsxff' })
            .row()
            .text('← Назад к тарифам', 'back_to_packages');
        await ctx.editMessageText(text, { reply_markup: kb.reply_markup });
    } catch (e) { /* message too old */ }
});

bot.callbackQuery('pkg_premium', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        const text = formatPackage(PACKAGES.premium) + '\n💬 Чтобы обсудить заказ, напишите нам:';
        const kb = new InlineKeyboard()
            .text('Написать Диме', { url: 'https://t.me/vxrxntsxff' })
            .row()
            .text('← Назад к тарифам', 'back_to_packages');
        await ctx.editMessageText(text, { reply_markup: kb.reply_markup });
    } catch (e) { /* message too old */ }
});

bot.callbackQuery('pkg_support', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        let text = '🛠 Техническая поддержка\n\n';
        text += `Цена: ${SUPPORT_INFO.price}\n\n`;
        text += 'Что входит:\n';
        for (const f of SUPPORT_INFO.features) text += `  ✓ ${f}\n`;
        text += '\nОплата ежемесячно. Отказ — в любой момент.';
        text += '\n\n💬 Чтобы обсудить, напишите нам:';
        const kb = new InlineKeyboard()
            .text('Написать Диме', { url: 'https://t.me/vxrxntsxff' })
            .row()
            .text('← Назад к тарифам', 'back_to_packages');
        await ctx.editMessageText(text, { reply_markup: kb.reply_markup });
    } catch (e) { /* message too old */ }
});

bot.callbackQuery('back_to_packages', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        let text = '📦 Наши тарифы:\n\n';
        for (const [key, pkg] of Object.entries(PACKAGES)) {
            const popular = pkg.popular ? ' ⭐ Популярный' : '';
            text += `▪️ «${pkg.name}» — ${pkg.price}${popular}\n`;
            text += `   ${pkg.description}\n\n`;
        }
        text += 'Поддержка после запуска: от 1 500 ₽/мес\n\n';
        text += 'Подробнее — выберите тариф:';
        await ctx.editMessageText(text, { reply_markup: packagesKeyboard().reply_markup });
    } catch (e) { /* message too old */ }
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
        if (!botInitPromise) {
            botInitPromise = bot.init();
        }
        await botInitPromise;
        await bot.handleUpdate(req.body);
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Bot error:', error);
        return res.status(200).json({ ok: true });
    }
};
