// ---------- App Shell: навигация и динамическая загрузка контента ----------
const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');

function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
  document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
  try {
    const response = await fetch(`/content/${page}.html`);
    const html = await response.text();
    contentDiv.innerHTML = html;
    if (page === 'home') {
      initNotes();         // инициализируем форму и список заметок
      initWebSocket();     // подключаем Socket.IO (если ещё не подключены)
    }
  } catch (err) {
    contentDiv.innerHTML = '<p class="is-center text-error">Ошибка загрузки страницы.</p>';
    console.error(err);
  }
}

homeBtn.addEventListener('click', () => {
  setActiveButton('home-btn');
  loadContent('home');
});
aboutBtn.addEventListener('click', () => {
  setActiveButton('about-btn');
  loadContent('about');
});

// Загружаем домашнюю страницу по умолчанию
loadContent('home');

// ---------- Работа с заметками (localStorage) ----------
function loadNotes() {
  const notes = JSON.parse(localStorage.getItem('notes') || '[]');
  const list = document.getElementById('notes-list');
  if (list) {
    list.innerHTML = notes.map(note => {
      let reminderInfo = '';
      if (note.reminder) {
        const date = new Date(note.reminder);
        const now = Date.now();
        const isExpired = note.reminder < now;
        reminderInfo = `<br><small style="color: ${isExpired ? '#999' : '#e67e22'};">
          ${isExpired ? '⌛' : '⏰'} Напоминание: ${date.toLocaleString()}
          ${isExpired ? ' (прошло)' : ''}
        </small>`;
      }
      return `<li class="card" style="margin-bottom: 0.5rem; padding: 0.75rem;">
        📌 ${note.text}
        ${reminderInfo}
        <small style="display: block; color: #888; font-size: 0.75rem;">${note.datetime || 'без даты'}</small>
      </li>`;
    }).join('');
  }
}

function addNote(text, datetime) {
  const notes = JSON.parse(localStorage.getItem('notes') || '[]');
  const newNote = { id: Date.now(), text, datetime: datetime || new Date().toLocaleString(), reminder: null };
  notes.push(newNote);
  localStorage.setItem('notes', JSON.stringify(notes));
  loadNotes();

  // Отправляем событие через WebSocket (если сокет подключён)
  if (socket && socket.connected) {
    socket.emit('newTask', { text, datetime: newNote.datetime });
  }
}

// Функция: добавление заметки с напоминанием
function addReminder(text, reminderTime) {
  const notes = JSON.parse(localStorage.getItem('notes') || '[]');
  const newNote = {
    id: Date.now(),
    text: text,
    datetime: new Date().toLocaleString(),
    reminder: reminderTime
  };
  notes.push(newNote);
  localStorage.setItem('notes', JSON.stringify(notes));
  loadNotes();

  // Отправляем событие на сервер для планирования push-уведомления
  if (socket && socket.connected) {
    socket.emit('newReminder', {
      id: newNote.id,
      text: text,
      reminderTime: reminderTime
    });
  }
  console.log(`📅 Напоминание запланировано на ${new Date(reminderTime).toLocaleString()}`);
}

// Функция: обновление времени напоминания в localStorage
function updateReminderTime(reminderId, newReminderTime) {
  const notes = JSON.parse(localStorage.getItem('notes') || '[]');
  const noteIndex = notes.findIndex(note => note.id === reminderId);
  
  if (noteIndex !== -1) {
    notes[noteIndex].reminder = newReminderTime;
    localStorage.setItem('notes', JSON.stringify(notes));
    console.log(`✅ Время напоминания обновлено: ${new Date(newReminderTime).toLocaleString()}`);
    loadNotes(); // Обновляем отображение
    return true;
  }
  return false;
}

// Синхронизация с сервером (запрашиваем актуальные времена напоминаний)
async function syncRemindersFromServer() {
  try {
    const response = await fetch('/get-reminders');
    if (!response.ok) return;
    
    const serverReminders = await response.json();
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    let updated = false;
    
    notes.forEach(note => {
      if (note.reminder && serverReminders[note.id]) {
        if (note.reminder !== serverReminders[note.id].reminderTime) {
          note.reminder = serverReminders[note.id].reminderTime;
          updated = true;
          console.log(`🔄 Синхронизация: обновлено время для заметки "${note.text}"`);
        }
      }
    });
    
    if (updated) {
      localStorage.setItem('notes', JSON.stringify(notes));
      loadNotes();
      console.log('✅ Синхронизация с сервером завершена');
    }
  } catch (err) {
    console.log('⚠️ Синхронизация не удалась (сервер может быть недоступен)');
  }
}

function initNotes() {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  const reminderForm = document.getElementById('reminder-form');
  const reminderText = document.getElementById('reminder-text');
  const reminderTime = document.getElementById('reminder-time');

  loadNotes();

  // Обычная форма (без напоминания)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (text) {
        addNote(text);
        input.value = '';
      }
    });
  }

  // Форма с напоминанием
  if (reminderForm) {
    reminderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = reminderText.value.trim();
      const time = reminderTime.value;
      if (text && time) {
        const timestamp = new Date(time).getTime();
        if (timestamp > Date.now()) {
          addReminder(text, timestamp);
          reminderText.value = '';
          reminderTime.value = '';
        } else {
          alert('⚠️ Дата и время должны быть в будущем!');
        }
      }
    });
  }
  
  // Запускаем синхронизацию с сервером
  syncRemindersFromServer();
}

// ---------- WebSocket (Socket.IO) ----------
let socket;

function initWebSocket() {
  if (socket && socket.connected) return;
  socket = io('https://localhost:3001', { transports: ['websocket'] });

  socket.on('connect', () => console.log('🔌 WebSocket подключён'));
  socket.on('disconnect', () => console.log('🔌 WebSocket отключён'));

  socket.on('taskAdded', (task) => {
    console.log('📨 Получена новая задача от другого клиента:', task);
    // Всплывающее уведомление в интерфейсе
    const notification = document.createElement('div');
    notification.textContent = `🆕 Новая задача: ${task.text}`;
    notification.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      background: #4285f4; color: white; padding: 1rem;
      border-radius: 8px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
  });
}

// ---------- Push-уведомления (VAPID) ----------
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Замените на свой ПУБЛИЧНЫЙ VAPID-ключ
const VAPID_PUBLIC_KEY = 'BG9oTm9SxY_RtOgQ87S6XQ_Qu1WCtrDLPlaWHp8H1J5tpoAgtXYpGadoCQgxuuAK1Gh0zr0fxCx6zt6tCqxt7fI';

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    await fetch('https://localhost:3001/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    console.log('✅ Подписка на push отправлена');
  } catch (err) {
    console.error('❌ Ошибка подписки на push:', err);
  }
}

async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await fetch('https://localhost:3001/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });
    await subscription.unsubscribe();
    console.log('❌ Отписка выполнена');
  }
}

// ---------- Получение сообщений от Service Worker ----------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📨 Сообщение от Service Worker:', event.data);
    
    if (event.data && event.data.type === 'REMINDER_SNOOZED') {
      const { reminderId, newReminderTime } = event.data;
      updateReminderTime(reminderId, newReminderTime);
      
      // Показываем уведомление об успешном откладывании
      const notification = document.createElement('div');
      notification.textContent = `⏰ Напоминание отложено на 5 минут!`;
      notification.style.cssText = `
        position: fixed; bottom: 20px; left: 20px;
        background: #27ae60; color: white; padding: 0.75rem 1.5rem;
        border-radius: 8px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  });
}

// Регистрация Service Worker и управление кнопками push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker зарегистрирован', reg);

      const enableBtn = document.getElementById('enable-push');
      const disableBtn = document.getElementById('disable-push');
      if (enableBtn && disableBtn) {
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
          enableBtn.style.display = 'none';
          disableBtn.style.display = 'inline-block';
        }

        enableBtn.addEventListener('click', async () => {
          if (Notification.permission === 'denied') {
            alert('❌ Уведомления запрещены. Разрешите их в настройках браузера.');
            return;
          }
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              alert('❌ Необходимо разрешить уведомления.');
              return;
            }
          }
          await subscribeToPush();
          enableBtn.style.display = 'none';
          disableBtn.style.display = 'inline-block';
        });

        disableBtn.addEventListener('click', async () => {
          await unsubscribeFromPush();
          disableBtn.style.display = 'none';
          enableBtn.style.display = 'inline-block';
        });
      }
      
      // Запрашиваем синхронизацию каждые 30 секунд
      setInterval(syncRemindersFromServer, 30000);
      
    } catch (err) {
      console.log('❌ Ошибка регистрации Service Worker:', err);
    }
  });
}

// Добавляем CSS анимацию для всплывающих уведомлений
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);