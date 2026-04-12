const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Замените на свои VAPID-ключи
const vapidKeys = {
  publicKey: 'BG9oTm9SxY_RtOgQ87S6XQ_Qu1WCtrDLPlaWHp8H1J5tpoAgtXYpGadoCQgxuuAK1Gh0zr0fxCx6zt6tCqxt7fI',
  privateKey: 'tI9QDnJDAz20pjtv9gQOIrb8DLLI83dsrXRl-A8eZ0c'
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

let subscriptions = [];
const reminders = new Map();

// Загрузка сертификатов
const options = {
  key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'localhost.pem'))
};

const server = https.createServer(options, app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);

  socket.on('newTask', (task) => {
    console.log('Новая задача от клиента:', task);
    io.emit('taskAdded', task);

    const payload = JSON.stringify({
      title: 'Новая задача',
      body: task.text
    });
    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
    });
  });

  socket.on('newReminder', (reminder) => {
    const { id, text, reminderTime } = reminder;
    const delay = reminderTime - Date.now();
    console.log(`📅 Новое напоминание: "${text}", id: ${id}`);
    console.log(`   Время: ${new Date(reminderTime).toLocaleString()}`);
    console.log(`   Задержка: ${Math.round(delay / 1000)} секунд`);

    if (delay <= 0) {
      console.log('❌ Время уже прошло');
      return;
    }

    const timeoutId = setTimeout(() => {
      console.log(`🔔 ОТПРАВКА напоминания для id ${id}: "${text}"`);
      
      const payload = JSON.stringify({
        title: '⏰ Напоминание',
        body: text,
        reminderId: id
      });
      
      console.log(`   Отправка ${subscriptions.length} подписчикам`);
      
      subscriptions.forEach(sub => {
        webpush.sendNotification(sub, payload).catch(err => {
          console.error('Push error:', err);
        });
      });
      
      // НЕ удаляем сразу, оставляем для возможности отложить
      // reminders.delete(id);
    }, delay);

    reminders.set(id, { 
      timeoutId, 
      text, 
      reminderTime,
      sent: false  // флаг, было ли отправлено
    });
    console.log(`✅ Запланировано. Всего активных: ${reminders.size}`);
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

app.post('/subscribe', (req, res) => {
  subscriptions.push(req.body);
  console.log(`✅ Подписка добавлена. Всего: ${subscriptions.length}`);
  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  console.log(`❌ Подписка удалена. Осталось: ${subscriptions.length}`);
  res.status(200).json({ message: 'Подписка удалена' });
});

// ========== ИСПРАВЛЕННЫЙ ЭНДПОИНТ /snooze ==========
app.post('/snooze', (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);
  console.log(`⏰ Запрос на откладывание для id: ${reminderId}`);
  console.log(`   Активные напоминания в Map: ${Array.from(reminders.keys())}`);

  if (!reminderId || !reminders.has(reminderId)) {
    console.log(`❌ Напоминание ${reminderId} не найдено в хранилище`);
    return res.status(400).json({ error: 'Reminder not found' });
  }

  
  const reminder = reminders.get(reminderId);
  console.log(`   Найдено: "${reminder.text}"`);
  
  // Отменяем предыдущий таймер
  if (reminder.timeoutId) {
    clearTimeout(reminder.timeoutId);
    console.log(`   Старый таймер отменён`);
  }

  const newDelay = 5 * 60 * 1000; // 5 минут
  const newTimeoutId = setTimeout(() => {
    console.log(`🔔 ОТПРАВКА ОТЛОЖЕННОГО напоминания для id ${reminderId}: "${reminder.text}"`);
    
    const payload = JSON.stringify({
      title: '⏰ Напоминание (отложено)',
      body: reminder.text,
      reminderId: reminderId
    });
    
    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
    });
    
    // Удаляем после отправки
    reminders.delete(reminderId);
    console.log(`   Напоминание удалено из хранилища`);
  }, newDelay);

  // Обновляем хранилище
  reminders.set(reminderId, {
    timeoutId: newTimeoutId,
    text: reminder.text,
    reminderTime: Date.now() + newDelay,
    sent: false
  });

  const newTime = new Date(Date.now() + newDelay).toLocaleString();
  console.log(`✅ Напоминание отложено на 5 минут`);
  console.log(`   Новое время: ${newTime}`);
  console.log(`   Всего активных: ${reminders.size}`);
  
  res.status(200).json({ message: 'Reminder snoozed for 5 minutes', newTime });
});

app.get('/get-reminders', (req, res) => {
  const activeReminders = {};
  reminders.forEach((value, key) => {
    activeReminders[key] = {
      reminderTime: value.reminderTime,
      text: value.text
    };
  });
  res.json(activeReminders);
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на https://localhost:${PORT}`);
  console.log(`   VAPID Public Key: ${vapidKeys.publicKey.substring(0, 30)}...`);
});