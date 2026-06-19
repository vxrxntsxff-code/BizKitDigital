/* ===== AI CHAT WIDGET ===== */
let chatOpen = false;

function toggleChat() {
    const win = document.getElementById('chatWindow');
    const btn = document.getElementById('chatToggleBtn');
    const widget = document.getElementById('chatWidget');

    if (chatOpen) {
        // Close: shrink window, show button
        win.style.transform = 'translateY(20px) scale(0.95)';
        win.style.opacity = '0';
        btn.style.transform = 'scale(1)';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        setTimeout(() => {
            win.classList.add('hidden');
            btn.style.display = 'flex';
        }, 250);
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Открыть чат');
    } else {
        // Open: hide button, expand window from button position
        btn.style.transform = 'scale(0)';
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
        win.classList.remove('hidden');
        // Force reflow then animate
        win.offsetHeight;
        win.style.transform = 'translateY(0) scale(1)';
        win.style.opacity = '1';
        setTimeout(() => {
            btn.style.display = 'none';
            document.getElementById('chatInput').focus();
        }, 250);
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-label', 'Закрыть чат');
    }
    chatOpen = !chatOpen;
}

function quickAsk(text) {
    document.getElementById('chatInput').value = text;
    sendMessage();
}

function toggleLeadForm() {
    const f = document.getElementById('leadFormSection');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

async function submitLead() {
    const name = document.getElementById('leadName').value.trim();
    const telegram = document.getElementById('leadTelegram').value.trim();
    const email = document.getElementById('leadEmail').value.trim();
    const service = document.getElementById('leadService').value;
    if (!name) { addMsg('Пожалуйста, укажите имя.'); return; }
    if (!telegram && !email) { addMsg('Укажите Telegram или Email, чтобы мы могли связаться.'); return; }
    document.getElementById('leadFormSection').style.display = 'none';
    addMsg('Заявка отправлена! ' + name + ', мы свяжемся с вами в ближайшее время.');
    try {
        await fetch('/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, telegram: telegram, email: email, service: service || 'не указана', message: 'Заявка из AI-чата' })
        });
    } catch(e) {}
}

let chatHistory = [];

function getLocalAnswer(q) {
    const lower = q.toLowerCase();

    // Приветствие
    if (/^(привет|здравствуй|добр|хай|hello|hi|йо)/i.test(lower)) {
        return 'Привет! Я Дима из BizkitDigital. Делаю сайты и ботов для бизнеса в Кемерово. Что интересует?';
    }

    // Цены
    if (/цени|стоим|сколько|прайс|тариф|пакет|budget/i.test(lower)) {
        return 'Пакеты:\n• Старт — 20 000₽ (лендинг + бот)\n• Бизнес — 35 000₽ (лендинг + бот + AI-чат) ⭐\n• Премиум — 50 000₽ (всё + оплата + CRM)\n\nКакой интересует?';
    }

    // Услуги
    if (/услуг|что дел|чем пом|что мож/i.test(lower)) {
        return 'Делаем: лендинги, Telegram-боты для записи, AI-чат на сайте, онлайн-оплату и интеграции с CRM. Всё пакетом за 2-3 дня. Что из этого нужно?';
    }

    // Сроки
    if (/срок|время|когда готов|быстро/i.test(lower)) {
        return 'Стандартный пакет готов за 2-3 рабочих дня. Сложные проекты — до 5 дней. Сроки фиксируем после брифа.';
    }

    // Как работает
    if (/как раб|процесс|этап|порядок/i.test(lower)) {
        return '3 шага:\n1️⃣ Обсуждаем задачу (15 мин)\n2️⃣ Делаем за 2-3 дня\n3️⃣ Запускаем и обучаем\n\nОплата 50/50.';
    }

    // Контакты
    if (/контакт|связ|телефон|номер|напис|телеграм|email|почта/i.test(lower)) {
        return '📞 +7 (951) 592-26-18\n💬 Telegram: @vxrxntsxff\n📧 dimalengardt87@gmail.com\n\nНапиши в Telegram — отвечу быстрее!';
    }

    // Оплата
    if (/оплат|карт|сбп|юkassa|как плат|расчет/i.test(lower)) {
        return 'Принимаем карты (Visa, Mastercard, Мир) и СБП через ЮKassa. Оплата 50% предоплата + 50% после сдачи.';
    }

    // Возврат
    if (/возврат|гаранти|верн|если не понрав/i.test(lower)) {
        return 'Гарантия: если не понравится после финальной сдачи — вернём 100% предоплаты. Без вопросов.';
    }

    // Кейсы
    if (/кейс|пример|portfolio|работали|проект/i.test(lower)) {
        return 'Наши кейсы:\n✂️ Твой портной — +40% записей через бота\n🐾 Счастливый хвост — -60% звонков\n💅 Маникюрная N1 — экономия 8000₽/мес\n\nПосмотри подробнее на сайте!';
    }

    // Бот
    if (/бот|telegram.*бот|запис/i.test(lower)) {
        return 'Telegram-бот записывает клиентов 24/7. Они выбирают время, а бот записывает и напоминает. Пример: салон «Маникюрная N1» заменила YClients на нашего бота.';
    }

    // AI-чат
    if (/ai.?чат|чат.*сайт|помощник.*сайт/i.test(lower)) {
        return 'AI-чат отвечает на вопросы клиентов прямо на сайте 24/7. Знает цены, услуги, сроки. Пример: ветклиника «Счастливый хвост» — звонков стало на 60% меньше.';
    }

    // Сайт/лендинг
    if (/сайт|лендинг|визитк|страниц/i.test(lower)) {
        return 'Делаем лендинги от 1 до 7 экранов. Адаптивные, с формой заявки, AI-чатом и SEO. Готовы за 1-2 дня.';
    }

    // CRM
    if (/crm|таблиц|notion|amo|битрикс/i.test(lower)) {
        return 'Интегрируем с Google Таблицами, Notion. В пакете «Премиум» — полная CRM-интеграция.';
    }

    // Кемерово
    if (/кемерово|город|локал|местн/i.test(lower)) {
        return 'Из Кемерово, но работаем по всей России. Все процессы онлайн — от брифа до запуска.';
    }

    // Поддержка
    if (/поддержк|после.*запуск|обновлен|мониторинг/i.test(lower)) {
        return 'Поддержка: 1 500₽/мес — обновление контента, мониторинг, правки. Отказ в любой момент.';
    }

    // О компании
    if (/кто ты|о.*компани|бизн|бизкит|company/i.test(lower)) {
        return 'BizkitDigital — делаем цифровые решения для малого бизнеса в Кемерово. Сайты, боты, AI-чаты, оплата. Всё пакетом за 2-3 дня.';
    }

    // Оплата на сайте (через сайт)
    if (/заказ|оформ|купит|оплат.*сайт|перейти.*оплат/i.test(lower)) {
        return 'Оформи заказ прямо на сайте — нажми «Выбрать» на нужном пакете. Оплатишь картой или СБП через ЮKassa.';
    }

    // Если ничего не подошло
    return null;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, true);
    input.value = '';
    input.style.height = 'auto';
    const local = getLocalAnswer(text);
    if (local) {
        showTyping();
        await new Promise(r => setTimeout(r, 500));
        hideTyping();
        addMsg(local);
        return;
    }
    showTyping();
    chatHistory.push({ role: 'user', content: text });
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: chatHistory })
        });
        const data = await response.json();
        hideTyping();
        if (data.reply) {
            chatHistory.push({ role: 'assistant', content: data.reply });
            addMsg(data.reply);
        } else if (data.fallback) {
            const fallback = getLocalAnswer(text);
            if (fallback) { addMsg(fallback); }
            else { addMsg('Сейчас нагруженный час, попробуйте переформулировать вопрос или напишите в Telegram @vxrxntsxff.'); }
        } else {
            addMsg('Извините, не удалось получить ответ. Напишите в Telegram @vxrxntsxff.');
        }
    } catch (err) {
        hideTyping();
        addMsg('Сейчас высокая нагрузка. Попробуйте переформулировать вопрос или напишите в Telegram @vxrxntsxff.');
    }
}

let msgCounter = 0;
function addMsg(text, isUser = false) {
    const c = document.getElementById('chatMessages');
    const d = document.createElement('div');
    d.className = 'chat-msg-new';
    d.style.display = 'flex';
    d.style.gap = '8px';
    d.style.alignItems = 'flex-start';
    if (isUser) {
        d.style.flexDirection = 'row-reverse';
        d.innerHTML = '<div style="width:28px;height:28px;border-radius:8px;background:#3b82f6;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div style="background:#8b5cf6;border-radius:14px 14px 4px 14px;padding:10px 14px;max-width:280px;"><p style="font-size:13px;color:#fff;line-height:1.5;margin:0;word-wrap:break-word;">' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p></div>';
    } else {
        msgCounter++;
        const mid = 'msg-' + msgCounter;
        d.innerHTML = '<div style="width:28px;height:28px;border-radius:8px;background:#8b5cf6;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.8)"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.3)"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.3)"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.6)"/></svg></div><div><div style="background:#1a1a1e;border:1px solid #252528;border-radius:14px 14px 14px 4px;padding:10px 14px;max-width:280px;"><p style="font-size:13px;color:#d1d5db;line-height:1.5;margin:0;word-wrap:break-word;">' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p></div></div>';
    }
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
    const qa = document.getElementById('quickActions');
    if (qa && isUser) qa.style.display = 'none';
}

function rateMsg(btn, msgId, val) {
    const container = document.getElementById(msgId);
    if (!container) return;
    const btns = container.querySelectorAll('button');
    btns.forEach(b => { b.style.opacity = '0.3'; b.dataset.rated = '1'; b.disabled = true; });
    btn.style.opacity = '1';
    btn.style.transform = 'scale(1.3)';
}

function showTyping() { document.getElementById('typingIndicator').style.display = 'block'; }
function hideTyping() { document.getElementById('typingIndicator').style.display = 'none'; }

/* ===== MOBILE MENU TOGGLE ===== */
function initMobileMenu() {
    document.querySelectorAll('.menu-toggle').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            document.querySelector('header nav').classList.toggle('open');
        });
    });
    document.querySelectorAll('header nav a').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelector('.menu-toggle')?.classList.remove('active');
            document.querySelector('header nav')?.classList.remove('open');
        });
    });
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
});
