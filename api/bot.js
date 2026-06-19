const { Bot, InlineKeyboard } = require('grammy');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_ID;

if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not set');

const bot = new Bot(BOT_TOKEN);
let botInitPromise = null;

// State tracking for order flow
const userState = new Map();

const MENU_BUTTONS = ['📦 Тарифы', '🛠 Услуги', '❓ Как это работает', '💬 Задать вопрос', '📞 Контакты', '📋 Кейсы', '❓ Частые вопросы'];

const PACKAGES = {
    start: { name: 'Старт', price: '20 000 ₽', priceNum: 20000, desc: 'Для тех, кто хочет попробовать', features: ['Лендинг (до 3 экранов)', 'Telegram-бот для записи', 'Адаптивный дизайн', 'Домен на 1 год'] },
    business: { name: 'Бизнес', price: '35 000 ₽', priceNum: 35000, desc: 'Оптимальный выбор для роста', popular: true, features: ['Лендинг (до 5 экранов)', 'Telegram-бот для записи', 'AI-чат на сайте', 'Интеграция с Google Таблицами', 'Домен на 1 год'] },
    premium: { name: 'Премиум', price: '50 000 ₽', priceNum: 50000, desc: 'Максимум возможностей', features: ['Лендинг (до 7 экранов)', 'Telegram-бот для записи', 'AI-чат на сайте', 'Онлайн-оплата (ЮKassa)', 'CRM-интеграция', '3 месяца поддержки'] },
    custom: { name: 'Собрать свой', price: 'от 20 000 ₽', priceNum: 0, desc: 'Выбери только то, что нужно', features: [] },
    support: { name: 'Техподдержка', price: 'от 1 500 ₽/мес', priceNum: 0, desc: 'Обновления и правки после запуска', features: [] },
};

const CUSTOM_SERVICES = [
    { key: 'landing', name: 'Лендинг', price: 14000, emoji: '🌐' },
    { key: 'bot', name: 'Telegram-бот', price: 12000, emoji: '🤖' },
    { key: 'ai_chat', name: 'AI-чат', price: 10000, emoji: '💬' },
    { key: 'payment', name: 'Онлайн-оплата', price: 12000, emoji: '💳' },
    { key: 'crm', name: 'CRM-интеграция', price: 10000, emoji: '⚙️' },
    { key: 'domain', name: 'Домен', price: 2000, emoji: '🌐' },
];

const CASES = [
    { icon: '✂️', name: 'Твой портной', type: 'ателье', result: '+40% записей через бота' },
    { icon: '🐾', name: 'Счастливый хвост', type: 'ветклиника', result: '-60% звонков на ресепшен' },
    { icon: '💅', name: 'Маникюрная N1', type: 'салон красоты', result: 'Экономия 8 000₽/мес' },
];

// === KEYBOARDS ===
function mainKB() {
    return { reply_markup: { keyboard: [[{ text: '📦 Тарифы' }, { text: '🛠 Услуги' }], [{ text: '📋 Кейсы' }, { text: '❓ Частые вопросы' }], [{ text: '💬 Задать вопрос' }, { text: '📞 Контакты' }]], resize_keyboard: true } };
}

function tariffsInlineKB() {
    return new InlineKeyboard()
        .text('Старт — 20 000 ₽', 'pkg_start').row()
        .text('Бизнес — 35 000 ₽ ⭐', 'pkg_business').row()
        .text('Премиум — 50 000 ₽', 'pkg_premium').row()
        .text('Собрать свой тариф', 'pkg_custom').row()
        .text('Техподдержка', 'pkg_support');
}

function orderKB(pkgKey) {
    return new InlineKeyboard()
        .text('🛒 Оформить заказ', 'order_' + pkgKey).row()
        .text('💬 Написать Диме', { url: 'https://t.me/vxrxntsxff' }).row()
        .text('← Назад к тарифам', 'back_to_tariffs');
}

function confirmOrderKB() {
    return new InlineKeyboard()
        .text('✅ Подтвердить', 'order_confirm').row()
        .text('❌ Отменить', 'order_cancel');
}

function customServiceKB(selected) {
    const kb = new InlineKeyboard();
    for (const s of CUSTOM_SERVICES) {
        const check = selected.includes(s.key) ? '✅' : '⬜';
        kb.text(`${check} ${s.name} — ${s.price.toLocaleString('ru-RU')}₽`, 'cs_toggle_' + s.key).row();
    }
    const total = CUSTOM_SERVICES.filter(s => selected.includes(s.key)).reduce((sum, s) => sum + s.price, 0);
    kb.text(`🛒 Заказать — ${total.toLocaleString('ru-RU')}₽`, 'cs_order').row();
    kb.text('← Назад к тарифам', 'back_to_tariffs');
    return kb;
}

function formatPackage(pkg) {
    let t = `📦 Пакет «${pkg.name}»${pkg.popular ? ' ⭐' : ''}\n\nЦена: ${pkg.price}\n${pkg.desc}\n\nЧто входит:\n`;
    for (const f of pkg.features) t += `  ✓ ${f}\n`;
    return t;
}

// === COMMANDS ===
bot.command('start', async (ctx) => {
    const dl = ctx.match;
    if (dl && PACKAGES[dl]) {
        await ctx.reply(formatPackage(PACKAGES[dl]), { reply_markup: orderKB(dl) });
        return;
    }
    await ctx.reply('👋 Привет! Я бот BizkitDigital.\n\nМы создаём цифровые пакеты для бизнеса: сайты, Telegram-боты, AI-чаты и интеграции.\n\nВыберите действие:', mainKB());
});

bot.command('ver', async (ctx) => { await ctx.reply('v3.0 — order flow in chat'); });
bot.command('help', async (ctx) => { await ctx.reply('ℹ️ Используйте кнопки внизу: Тарифы, Услуги, Кейсы, FAQ, Контакты'); });

// === MENU BUTTONS ===
bot.hears('📦 Тарифы', async (ctx) => {
    let t = '📦 Наши тарифы:\n\n▪️ «Старт» — 20 000₽ (лендинг + бот)\n▪️ «Бизнес» — 35 000₽ ⭐ (лендинг + бот + AI-чат)\n▪️ «Премиум» — 50 000₽ (всё + оплата + CRM)\n▪️ «Собрать свой» — от 20 000₽\n\nПоддержка: от 1 500₽/мес\n\nВыберите тариф:';
    await ctx.reply(t, { reply_markup: tariffsInlineKB() });
});

bot.hears('🛠 Услуги', async (ctx) => {
    await ctx.reply('🛠 Услуги:\n\n🌐 Лендинги — от 14 000₽\n🤖 Telegram-боты — 12 000₽\n💬 AI-чат — 10 000₽\n⚙️ Интеграции — 10 000₽\n💳 Оплата — 12 000₽\n🛠 Поддержка — от 1 500₽/мес\n\n💡 Нужен весь функционал? Нажмите 📦 Тарифы');
});

bot.hears('❓ Как это работает', async (ctx) => {
    await ctx.reply('❓ Процесс:\n\n1️⃣ Знакомство — обсуждаем задачи\n2️⃣ Разработка — 2-3 дня\n3️⃣ Запуск — подключаем, обучаем\n4️⃣ Поддержка — помогаем каждый месяц\n\n💰 Оплата полная через ЮKassa\n🔒 Гарантия: возврат 100%');
});

bot.hears('📋 Кейсы', async (ctx) => {
    let t = '📋 Проекты:\n\n';
    for (const c of CASES) t += `${c.icon} «${c.name}» (${c.type}) — ${c.result}\n`;
    t += '\nПодробнее: bizkitdigital.vercel.app/cases.html';
    await ctx.reply(t);
});

bot.hears('❓ Частые вопросы', async (ctx) => {
    await ctx.reply('❓ FAQ:\n\n💳 Оплата: полная через ЮKassa\n⏰ Сроки: 2-3 дня\n🔄 Возврат: 100%\n🌐 Домен: на 1 год\n🛠 Поддержка: от 1 500₽/мес');
});

bot.hears('📞 Контакты', async (ctx) => {
    await ctx.reply('📞 Контакты:\n\n💬 @vxrxntsxff\n📱 +7 (951) 592-26-18\n📧 dimalengardt87@gmail.com\n🌐 bizkitdigital.vercel.app\n\nЛенгардт Дмитрий\nСамозанятый | ИНН 420544798477');
});

bot.hears('💬 Задать вопрос', async (ctx) => {
    await ctx.reply('💬 Напишите вопрос, ответим.\n\nИли напрямую:\n📱 +7 (951) 592-26-18\n💬 @vxrxntsxff');
});

// === PACKAGE DETAILS (inline callbacks) ===
for (const [key, pkg] of Object.entries(PACKAGES)) {
    if (key === 'custom' || key === 'support') continue;
    bot.callbackQuery('pkg_' + key, async (ctx) => {
        try {
            await ctx.answerCallbackQuery();
            await ctx.editMessageText(formatPackage(pkg) + '\n🛒 Нажмите «Оформить заказ»:', { reply_markup: orderKB(key) });
        } catch (e) {}
    });
}

bot.callbackQuery('pkg_custom', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        userState.set(ctx.from.id, { step: 'custom_select', selected: [] });
        const t = '🔧 Собери свой тариф\n\nОтметьте что нужно:\n\n💡 Если нужен весь функционал — дешевле «Премиум» за 50 000₽';
        await ctx.editMessageText(t, { reply_markup: customServiceKB([]) });
    } catch (e) {}
});

bot.callbackQuery('pkg_support', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        userState.set(ctx.from.id, { step: 'support_order' });
        await ctx.editMessageText('🛠 Техподдержка — от 1 500₽/мес\n\nЧто входит:\n  ✓ Исправление багов\n  ✓ Обновление контента\n  ✓ Мелкие правки дизайна\n  ✓ SSL и мониторинг\n  ✓ Консультации\n\n🛒 Оформить поддержку:', { reply_markup: orderKB('support') });
    } catch (e) {}
});

// === CUSTOM PACKAGE TOGGLE ===
bot.callbackQuery(/^cs_toggle_(.+)$/, async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        const serviceKey = ctx.match[1];
        const state = userState.get(ctx.from.id) || { step: 'custom_select', selected: [] };
        const idx = state.selected.indexOf(serviceKey);
        if (idx >= 0) state.selected.splice(idx, 1);
        else state.selected.push(serviceKey);
        userState.set(ctx.from.id, state);

        const total = CUSTOM_SERVICES.filter(s => state.selected.includes(s.key)).reduce((sum, s) => sum + s.price, 0);
        const t = `🔧 Собери свой тариф\n\nОтметьте что нужно:\n\nИтого: ${total.toLocaleString('ru-RU')}₽\n💡 Полный набор дешевле «Премиум» за 50 000₽`;
        await ctx.editMessageText(t, { reply_markup: customServiceKB(state.selected) });
    } catch (e) {}
});

bot.callbackQuery('cs_order', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        const state = userState.get(ctx.from.id);
        if (!state || !state.selected.length) {
            await ctx.answerCallbackQuery({ text: 'Выберите хотя бы одну услугу', show_alert: true });
            return;
        }
        userState.set(ctx.from.id, { step: 'name', pkg: 'custom', selected: state.selected });
        await ctx.reply('Как вас зовут?');
    } catch (e) {}
});

// === ORDER FLOW ===
bot.callbackQuery('order_confirm', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        const state = userState.get(ctx.from.id);
        if (!state || state.step !== 'confirm') return;

        const user = ctx.from;
        const pkg = PACKAGES[state.pkg];
        let orderText = '';

        if (state.pkg === 'custom' && state.selected) {
            const services = CUSTOM_SERVICES.filter(s => state.selected.includes(s.key));
            const total = services.reduce((sum, s) => sum + s.price, 0);
            orderText = `🛒 НОВЫЙ ЗАКАЗ (Собрать свой)\n\n👤 Имя: ${state.name}\n📱 Телефон: ${state.phone}\n💬 Telegram: @${user.username || user.first_name}\n\n📦 Услуги:\n`;
            for (const s of services) orderText += `  ${s.emoji} ${s.name} — ${s.price.toLocaleString('ru-RU')}₽\n`;
            orderText += `\n💰 Итого: ${total.toLocaleString('ru-RU')}₽`;
        } else {
            orderText = `🛒 НОВЫЙ ЗАКАЗ\n\n👤 Имя: ${state.name}\n📱 Телефон: ${state.phone}\n💬 Telegram: @${user.username || user.first_name}\n\n📦 Пакет: «${pkg.name}»\n💰 Цена: ${pkg.price}`;
        }

        if (OWNER_CHAT_ID) {
            try { await ctx.api.sendMessage(OWNER_CHAT_ID, orderText); } catch (e) {}
        }

        await ctx.reply('✅ Заявка отправлена!\n\nДима свяжется с вами в ближайшее время.\n\n💬 Или напишите: @vxrxntsxff');
        userState.delete(ctx.from.id);
    } catch (e) {}
});

bot.callbackQuery('order_cancel', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        userState.delete(ctx.from.id);
        await ctx.reply('❌ Заказ отменён.', mainKB());
    } catch (e) {}
});

bot.callbackQuery(/^order_(.+)$/, async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        const pkgKey = ctx.match[1];
        userState.set(ctx.from.id, { step: 'name', pkg: pkgKey });
        await ctx.reply('Как вас зовут?');
    } catch (e) {}
});

bot.callbackQuery('back_to_tariffs', async (ctx) => {
    try {
        await ctx.answerCallbackQuery();
        userState.delete(ctx.from.id);
        let t = '📦 Наши тарифы:\n\n▪️ «Старт» — 20 000₽\n▪️ «Бизнес» — 35 000₽ ⭐\n▪️ «Премиум» — 50 000₽\n▪️ «Собрать свой» — от 20 000₽\n\nВыберите:';
        await ctx.editMessageText(t, { reply_markup: tariffsInlineKB() });
    } catch (e) {}
});

// === TEXT INPUT HANDLER (for order flow) ===
bot.on('message:text', async (ctx) => {
    const userId = ctx.from.id;
    const state = userState.get(userId);
    const text = ctx.message.text;

    // If user is in order flow
    if (state) {
        if (state.step === 'name') {
            state.name = text.trim();
            state.step = 'phone';
            userState.set(userId, state);
            await ctx.reply('📱 Ваш телефон (в формате +7 XXX XXX-XX-XX):');
            return;
        }
        if (state.step === 'phone') {
            state.phone = text.trim();
            state.step = 'confirm';
            userState.set(userId, state);

            const pkg = PACKAGES[state.pkg];
            let confirmText = '';
            if (state.pkg === 'custom' && state.selected) {
                const services = CUSTOM_SERVICES.filter(s => state.selected.includes(s.key));
                const total = services.reduce((sum, s) => sum + s.price, 0);
                confirmText = `📋 Подтвердите заказ:\n\n👤 Имя: ${state.name}\n📱 Телефон: ${state.phone}\n\n🔧 Услуги:\n`;
                for (const s of services) confirmText += `  ${s.emoji} ${s.name} — ${s.price.toLocaleString('ru-RU')}₽\n`;
                confirmText += `\n💰 Итого: ${total.toLocaleString('ru-RU')}₽`;
            } else {
                confirmText = `📋 Подтвердите заказ:\n\n👤 Имя: ${state.name}\n📱 Телефон: ${state.phone}\n📦 Пакет: «${pkg.name}» — ${pkg.price}`;
            }

            await ctx.reply(confirmText + '\n\nВсё верно?', { reply_markup: confirmOrderKB() });
            return;
        }
    }

    // Regular message forwarding to owner
    if (MENU_BUTTONS.includes(text) || text.startsWith('/')) return;
    if (OWNER_CHAT_ID) {
        try {
            await ctx.api.sendMessage(OWNER_CHAT_ID, `📩 Клиент: @${ctx.from.username || ctx.from.first_name} (ID: ${ctx.from.id})\n\n${text}`);
        } catch (e) {}
    }
});

// Catch-all for unknown callbacks (debug)
bot.on('callback_query:data', async (ctx) => {
    console.log('Unknown callback:', ctx.callbackQuery.data);
    await ctx.answerCallbackQuery();
});

// === STARTUP ===
module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(200).json({ ok: true, v: '3.0' });
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
