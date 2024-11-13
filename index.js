import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

// 사용자 이름 부여
let userCount = 0;

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: '.' });
});

// 연결된 클라이언트에 이벤트 처리
io.on('connection', (socket) => {
  console.log('A user connected');

  // 들어온 순서대로 사용자 이름 부여
  userCount++;
  const username = `user${userCount}`;

  socket.emit('user name', username);

  // 메시지 전송 이벤트
  socket.on('chat message', (msg) => {
    const timestamp = new Date().toLocaleTimeString(); // 현재 시간 표시
    io.emit('chat message', { username, msg, timestamp });
  });

  // 사용자 연결 해제 시
  socket.on('disconnect', () => {
    console.log(`${username} disconnected`);
  });
});

// 서버 실행
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
