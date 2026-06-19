/* ===== AI CHAT WIDGET ===== */
let chatOpen = false;

function toggleChat() {
    const win = document.getElementById('chatWindow');
    const iconOpen = document.getElementById('chatIconOpen');
    const iconClose = document.getElementById('chatIconClose');
    const toggleBtn = document.getElementById('chatToggleBtn');
    if (chatOpen) {
        win.classList.add('closing');
        setTimeout(() => { win.classList.add('hidden'); win.classList.remove('closing'); }, 200);
        iconOpen.style.display = '';
        iconClose.style.display = 'none';
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.setAttribute('aria-label', 'Открыть чат');
        }
    } else {
        win.classList.remove('hidden', 'closing');
        iconOpen.style.display = 'none';
        iconClose.style.display = '';
        document.getElementById('chatInput').focus();
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'true');
            toggleBtn.setAttribute('aria-label', 'Закрыть чат');
        }
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
    const kb = {
        'услуги': 'BizkitDigital делает: лендинги, Telegram-боты для записи, AI-чат на сайте, онлайн-оплату (ЮKassa), интеграции с CRM. Всё пакетом от 20 000₽.',
        'цены': 'Пакеты: Старт — 20 000₽, Бизнес — 35 000₽, Премиум — 50 000₽. Поддержка: 1 500₽/мес. Оплата 50/50.',
        'стоимость': 'Пакеты: Старт — 20 000₽, Бизнес — 35 000₽, Премиум — 50 000₽.',
        'сколько': 'Пакеты: Старт — 20 000₽, Бизнес — 35 000₽, Премиум — 50 000₽.',
        'сроки': 'Разработка занимает 2-3 рабочих дня. Оплата 50/50.',
        'время': 'Разработка занимает 2-3 рабочих дня.',
        'запись': 'Telegram-бот автоматически записывает клиентов. Интеграция с Google Календарём.',
        'оплата': 'Принимаем карты (Visa, Mastercard, Мир) и СБП через ЮKassa. Оплата 50/50.',
        'бот': 'Telegram-бот работает 24/7. Автоматическая запись, рассылки, FAQ.',
        'сайт': 'Лендинг с адаптивным дизайном, формой обратной связи и AI-чатом.',
        'лендинг': 'Лендинг — одностраничный сайт от 20 000₽.',
        'ai-чат': 'AI-чат на сайте отвечает на вопросы клиентов 24/7.',
        'контакт': 'Telegram: @vxrxntsxff | @BizkitDigital_bot | Тел: +7(951)5922618',
        'телефон': '+7 (951) 592-26-18',
        'поддержка': 'После запуска: обновление контента, мониторинг, консультации. 1 500₽/мес.',
        'инн': 'ИНН: 420544798477. Самозанятый (НПД). Ленгардт Дмитрий Евгеньевич.',
        'реквизиты': 'ИНН: 420544798477. Самозанятый (НПД). Ленгардт Дмитрий Евгеньевич.',
        'crm': 'Интеграция с CRM (Google Таблицы, Notion) доступна в пакете Премиум за 50 000₽.',
        'кемерово': 'Мы из Кемерово, работаем по всей России.',
        'домен': 'Домен на 1 год включён во все пакеты.',
        'telegram': 'Telegram: @vxrxntsxff | Бот: @BizkitDigital_bot',
        'юkassa': 'Онлайн-оплата через ЮKassa доступна в пакете Премиум. Принимаем карты и СБП.',
        'оплата картой': 'Принимаем Visa, Mastercard, Мир и СБП через ЮKassa.',
        'portfolio': 'Посмотрите наши кейсы: bizkitdigital.vercel.app/cases.html',
    };
    const lower = q.toLowerCase();
    for (const [key, val] of Object.entries(kb)) {
        if (lower.includes(key)) return val;
    }
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
        d.innerHTML = '<div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);border-radius:14px 14px 4px 14px;padding:10px 14px;max-width:320px;"><p style="font-size:13px;color:#fff;line-height:1.5;margin:0;word-wrap:break-word;">' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p></div>';
    } else {
        msgCounter++;
        const mid = 'msg-' + msgCounter;
        d.innerHTML = '<div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.8)"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.3)"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.3)"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.6)"/></svg></div><div><div style="background:#1a1a1e;border:1px solid #252528;border-radius:14px 14px 14px 4px;padding:10px 14px;max-width:320px;"><p style="font-size:13px;color:#d1d5db;line-height:1.5;margin:0;word-wrap:break-word;">' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p></div><div id="'+mid+'" style="display:flex;gap:4px;margin-top:4px;padding-left:2px;"><button onclick="rateMsg(this,\''+mid+'\',1)" style="background:none;border:none;cursor:pointer;font-size:14px;opacity:0.4;transition:opacity 0.2s;" onmouseover="this.style.opacity=\'1\'" onmouseout="if(!this.dataset.rated)this.style.opacity=\'0.4\'">👍</button><button onclick="rateMsg(this,\''+mid+'\',-1)" style="background:none;border:none;cursor:pointer;font-size:14px;opacity:0.4;transition:opacity 0.2s;" onmouseover="this.style.opacity=\'1\'" onmouseout="if(!this.dataset.rated)this.style.opacity=\'0.4\'">👎</button></div></div>';
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
