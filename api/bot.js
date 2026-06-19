const { Bot, InlineKeyboard } = require('grammy');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_ID;

if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not set');

const bot = new Bot(BOT_TOKEN);
let botInitPromise = null;
const userState = new Map();

const PACKAGES = {
    start: { name: 'Старт', price: '20 000 ₽', desc: 'Для тех, кто хочет попробовать', features: ['Лендинг (до 3 экранов)', 'Telegram-бот для записи', 'Адаптивный дизайн', 'Домен на 1 год'] },
    business: { name: 'Бизнес', price: '35 000 ₽', desc: 'Оптимальный выбор для роста', popular: true, features: ['Лендинг (до 5 экранов)', 'Telegram-бот для записи', 'AI-чат на сайте', 'Интеграция с Google Таблицами', 'Домен на 1 год'] },
    premium: { name: 'Премиум', price: '50 000 ₽', desc: 'Максимум возможностей', features: ['Лендинг (до 7 экранов)', 'Telegram-бот для записи', 'AI-чат на сайте', 'Онлайн-оплата (ЮKassa)', 'CRM-интеграция', '3 месяца поддержки'] },
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
    { icon: '✂️', name: 'Твой портной', type: 'ателье', result: '+40% записей' },
    { icon: '🐾', name: 'Счастливый хвост', type: 'ветклиника', result: '-60% звонков' },
    { icon: '💅', name: 'Маникюрная N1', type: 'салон', result: 'Экономия 8 000₽/мес' },
];

function mainKB() {
    return { reply_markup: { keyboard: [[{ text: '📦 Тарифы' }, { text: '🛠 Услуги' }], [{ text: '📋 Кейсы' }, { text: '❓ Частые вопросы' }], [{ text: '💬 Задать вопрос' }, { text: '📞 Контакты' }]], resize_keyboard: true } };
}

function tariffsKB() {
    return new InlineKeyboard()
        .text('Старт — 20 000 ₽', 'pkg_start').row()
        .text('Бизнес — 35 000 ₽ ⭐', 'pkg_business').row()
        .text('Премиум — 50 000 ₽', 'pkg_premium').row()
        .text('Собрать свой тариф', 'pkg_custom').row()
        .text('Техподдержка', 'pkg_support');
}

function orderKB(pkg) {
    return new InlineKeyboard()
        .text('🛒 Оформить заказ', 'do_order_' + pkg).row()
        .url('💬 Написать Диме', 'https://t.me/vxrxntsxff').row()
        .text('← Назад к тарифам', 'back_tariffs');
}

function confirmKB() {
    return new InlineKeyboard().text('✅ Подтвердить', 'confirm_yes').row().text('❌ Отменить', 'confirm_no');
}

function customKB(sel) {
    const kb = new InlineKeyboard();
    for (const s of CUSTOM_SERVICES) {
        kb.text((sel.includes(s.key) ? '✅' : '⬜') + ' ' + s.name + ' — ' + s.price.toLocaleString('ru-RU') + '₽', 'cs_' + s.key).row();
    }
    const total = CUSTOM_SERVICES.filter(s => sel.includes(s.key)).reduce((a, s) => a + s.price, 0);
    kb.text('🛒 Заказать — ' + total.toLocaleString('ru-RU') + '₽', 'cs_send').row();
    kb.text('← Назад к тарифам', 'back_tariffs');
    return kb;
}

function pkgText(pkg) {
    let t = '📦 «' + pkg.name + '»' + (pkg.popular ? ' ⭐' : '') + '\n\nЦена: ' + pkg.price + '\n' + pkg.desc + '\n\nЧто входит:\n';
    for (const f of pkg.features) t += '  ✓ ' + f + '\n';
    return t;
}

// === /start ===
bot.command('start', async (ctx) => {
    const dl = ctx.match;
    if (dl === 'start' || dl === 'business' || dl === 'premium') {
        const pkg = PACKAGES[dl];
        if (pkg) { await ctx.reply(pkgText(pkg), { reply_markup: orderKB(dl) }); return; }
    }
    await ctx.reply('👋 Привет! Я бот BizkitDigital.\n\nМы создаём цифровые пакеты для бизнеса.\n\nВыберите действие:', mainKB());
});

bot.command('ver', async (ctx) => { await ctx.reply('v3.1'); });

// === MENU ===
bot.hears('📦 Тарифы', async (ctx) => {
    await ctx.reply('📦 Тарифы:\n\n▪️ «Старт» — 20 000₽ (лендинг + бот)\n▪️ «Бизнес» — 35 000₽ ⭐\n▪️ «Премиум» — 50 000₽ (всё)\n▪️ «Собрать свой» — от 20 000₽\n\nПоддержка: от 1 500₽/мес\n\nВыберите:', { reply_markup: tariffsKB() });
});
bot.hears('🛠 Услуги', async (ctx) => {
    await ctx.reply('🛠 Услуги:\n\n🌐 Лендинги — от 14 000₽\n🤖 Telegram-боты — 12 000₽\n💬 AI-чат — 10 000₽\n⚙️ Интеграции — 10 000₽\n💳 Оплата — 12 000₽\n🛠 Поддержка — от 1 500₽/мес');
});
bot.hears('❓ Как это работает', async (ctx) => {
    await ctx.reply('❓ 1️⃣ Знакомство → 2️⃣ Разработка 2-3 дня → 3️⃣ Запуск → 4️⃣ Поддержка\n\n💰 Оплата полная через ЮKassa\n🔒 Возврат 100%');
});
bot.hears('📋 Кейсы', async (ctx) => {
    let t = '📋 Проекты:\n\n';
    for (const c of CASES) t += c.icon + ' «' + c.name + '» (' + c.type + ') — ' + c.result + '\n';
    await ctx.reply(t + '\nbizkitdigital.vercel.app/cases.html');
});
bot.hears('❓ Частые вопросы', async (ctx) => {
    await ctx.reply('❓ 💳 Оплата: полная через ЮKassa\n⏰ Сроки: 2-3 дня\n🔄 Возврат: 100%\n🌐 Домен: 1 год\n🛠 Поддержка: от 1 500₽/мес');
});
bot.hears('📞 Контакты', async (ctx) => {
    await ctx.reply('📞 @vxrxntsxff | +7(951)5922618 | dimalengardt87@gmail.com\n\nЛенгардт Дмитрий | ИНН 420544798477');
});
bot.hears('💬 Задать вопрос', async (ctx) => {
    await ctx.reply('💬 Напишите вопрос.\n\nИли: 📱 +7(951)5922618 | 💬 @vxrxntsxff');
});

// === CALLBACKS: package details ===
bot.callbackQuery('pkg_start', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(pkgText(PACKAGES.start) + '\n🛒 Оформить:', { reply_markup: orderKB('start') });
});
bot.callbackQuery('pkg_business', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(pkgText(PACKAGES.business) + '\n🛒 Оформить:', { reply_markup: orderKB('business') });
});
bot.callbackQuery('pkg_premium', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(pkgText(PACKAGES.premium) + '\n🛒 Оформить:', { reply_markup: orderKB('premium') });
});
bot.callbackQuery('pkg_custom', async (ctx) => {
    await ctx.answerCallbackQuery();
    userState.set(ctx.from.id, { step: 'custom', sel: [] });
    await ctx.editMessageText('🔧 Собери свой тариф:\n\nОтметьте что нужно:', { reply_markup: customKB([]) });
});
bot.callbackQuery('pkg_support', async (ctx) => {
    await ctx.answerCallbackQuery();
    userState.set(ctx.from.id, { step: 'support' });
    await ctx.editMessageText('🛠 Поддержка — от 1 500₽/мес\n\n✓ Баги ✓ Контент ✓ Дизайн ✓ SSL ✓ Мониторинг\n\n🛒 Оформить:', { reply_markup: orderKB('support') });
});

// === CUSTOM PACKAGE TOGGLE ===
bot.callbackQuery(/^cs_([a-z_]+)$/, async (ctx) => {
    const key = ctx.match[1];
    if (key === 'send') {
        const st = userState.get(ctx.from.id);
        if (!st || !st.sel.length) { await ctx.answerCallbackQuery({ text: 'Выберите услугу', show_alert: true }); return; }
        userState.set(ctx.from.id, { step: 'name', pkg: 'custom', sel: st.sel });
        await ctx.answerCallbackQuery();
        await ctx.reply('Как вас зовут?');
        return;
    }
    await ctx.answerCallbackQuery();
    const st = userState.get(ctx.from.id) || { step: 'custom', sel: [] };
    const i = st.sel.indexOf(key);
    if (i >= 0) st.sel.splice(i, 1); else st.sel.push(key);
    userState.set(ctx.from.id, st);
    const total = CUSTOM_SERVICES.filter(s => st.sel.includes(s.key)).reduce((a, s) => a + s.price, 0);
    await ctx.editMessageText('🔧 Собери свой тариф:\n\nИтого: ' + total.toLocaleString('ru-RU') + '₽\n💡 Полный набор дешевле «Премиум» за 50 000₽', { reply_markup: customKB(st.sel) });
});

// === ORDER FLOW: confirm / cancel ===
bot.callbackQuery('confirm_yes', async (ctx) => {
    await ctx.answerCallbackQuery();
    const st = userState.get(ctx.from.id);
    if (!st || st.step !== 'confirm') return;
    const user = ctx.from;
    let msg = '';
    if (st.pkg === 'custom' && st.sel) {
        const svcs = CUSTOM_SERVICES.filter(s => st.sel.includes(s.key));
        const total = svcs.reduce((a, s) => a + s.price, 0);
        msg = '🛒 НОВЫЙ ЗАКАЗ\n\n👤 ' + st.name + '\n📱 ' + st.phone + '\n💬 @' + (user.username || user.first_name) + '\n\n📦 Услуги:\n';
        for (const s of svcs) msg += '  ' + s.emoji + ' ' + s.name + ' — ' + s.price.toLocaleString('ru-RU') + '₽\n';
        msg += '\n💰 Итого: ' + total.toLocaleString('ru-RU') + '₽';
    } else {
        const pkg = PACKAGES[st.pkg] || { name: st.pkg, price: '1 500 ₽/мес' };
        msg = '🛒 НОВЫЙ ЗАКАЗ\n\n👤 ' + st.name + '\n📱 ' + st.phone + '\n💬 @' + (user.username || user.first_name) + '\n\n📦 ' + pkg.name + ' — ' + pkg.price;
    }
    if (OWNER_CHAT_ID) { try { await ctx.api.sendMessage(OWNER_CHAT_ID, msg); } catch (e) {} }
    await ctx.reply('✅ Заявка отправлена!\n\nДима свяжется с вами.\n💬 @vxrxntsxff');
    userState.delete(ctx.from.id);
});

bot.callbackQuery('confirm_no', async (ctx) => {
    await ctx.answerCallbackQuery();
    userState.delete(ctx.from.id);
    await ctx.reply('❌ Отменено.', mainKB());
});

// === ORDER FLOW: start order ===
bot.callbackQuery(/^do_order_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    userState.set(ctx.from.id, { step: 'name', pkg: ctx.match[1] });
    await ctx.reply('Как вас зовут?');
});

// === BACK TO TARIFFS ===
bot.callbackQuery('back_tariffs', async (ctx) => {
    await ctx.answerCallbackQuery();
    userState.delete(ctx.from.id);
    await ctx.editMessageText('📦 Тарифы:\n\n▪️ «Старт» — 20 000₽\n▪️ «Бизнес» — 35 000₽ ⭐\n▪️ «Премиум» — 50 000₽\n▪️ «Собрать свой» — от 20 000₽\n\nВыберите:', { reply_markup: tariffsKB() });
});

// === TEXT INPUT: order flow ===
bot.on('message:text', async (ctx) => {
    const uid = ctx.from.id;
    const st = userState.get(uid);
    const txt = ctx.message.text;

    if (st && st.step === 'name') {
        st.name = txt.trim();
        st.step = 'phone';
        userState.set(uid, st);
        await ctx.reply('📱 Телефон (+7 XXX XXX-XX-XX):');
        return;
    }
    if (st && st.step === 'phone') {
        st.phone = txt.trim();
        st.step = 'confirm';
        userState.set(uid, st);
        const pkg = PACKAGES[st.pkg] || { name: st.pkg, price: '1 500 ₽/мес' };
        let t = '📋 Подтвердите:\n\n👤 ' + st.name + '\n📱 ' + st.phone + '\n📦 ' + pkg.name + ' — ' + pkg.price;
        if (st.pkg === 'custom' && st.sel) {
            const svcs = CUSTOM_SERVICES.filter(s => st.sel.includes(s.key));
            const total = svcs.reduce((a, s) => a + s.price, 0);
            t = '📋 Подтвердите:\n\n👤 ' + st.name + '\n📱 ' + st.phone + '\n\n📦 Услуги:\n';
            for (const s of svcs) t += '  ' + s.emoji + ' ' + s.name + ' — ' + s.price.toLocaleString('ru-RU') + '₽\n';
            t += '\n💰 Итого: ' + total.toLocaleString('ru-RU') + '₽';
        }
        await ctx.reply(t + '\n\nВсё верно?', { reply_markup: confirmKB() });
        return;
    }

    // Forward other messages to owner
    if (OWNER_CHAT_ID && !txt.startsWith('/') && txt.length < 2000) {
        try { await ctx.api.sendMessage(OWNER_CHAT_ID, '📩 ' + ctx.from.first_name + ' (@' + (ctx.from.username || '') + '):\n' + txt); } catch (e) {}
    }
});

// === STARTUP ===
module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(200).json({ ok: true, v: '3.1' });
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
