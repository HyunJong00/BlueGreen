const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3000 });

wss.on("connection", (ws) => {
  console.log("새 클라이언트가 연결되었습니다.");

  ws.on("message", (message) => {
    // 메시지 전송 시 JSON 형식으로 보내는지 확인
    try {
      const data = JSON.parse(message); // 클라이언트에서 전송된 메시지를 JSON 파싱

      // 연결된 모든 클라이언트에게 JSON 형식으로 전송
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));  // JSON 형식으로 전송
        }
      });
    } catch (err) {
      console.error("메시지 처리 오류:", err);
    }
  });
});

console.log("WebSocket signaling 서버가 ws://localhost:3000 에서 실행 중입니다.");
