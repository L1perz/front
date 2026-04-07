const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Замените на свои VAPID-ключи (сгенерируйте через `npx web-push generate-vapid-keys`)
const vapidKeys = {
  publicKey: 'BG9oTm9SxY_RtOgQ87S6XQ_Qu1WCtrDLPlaWHp8H1J5tpoAgtXYpGadoCQgxuuAK1Gh0zr0fxCx6zt6tCqxt7fI',
  privateKey: 'tI9QDnJDAz20pjtv9gQOIrb8DLLI83dsrXRl-A8eZ0c'
};

webpush.setVapidDetails(
  'mailto:your-email@example.com', // укажите свой email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Раздача статических файлов (index.html, app.js, sw.js, manifest.json, icons, content)
app.use(express.static(path.join(__dirname)));


let subscriptions = [];

// Загрузка сертификатов, сгенерированных mkcert
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
    // Рассылаем всем подключённым клиентам (включая отправителя)
    io.emit('taskAdded', task);

    // Отправляем push-уведомление всем подписанным пользователям
    const payload = JSON.stringify({
      title: 'Новая задача',
      body: task.text
    });
    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
    });
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

// Эндпоинты для управления push-подписками
app.post('/subscribe', (req, res) => {
  subscriptions.push(req.body);
  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  res.status(200).json({ message: 'Подписка удалена' });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на https://localhost:${PORT}`);
});