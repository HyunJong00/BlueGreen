const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

// HTTP 서버 생성
const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/main") {
    // 메인 페이지
    const filePath = path.join(__dirname, "main.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  } else if (req.url === "/webrtc") {
    // WebRTC 페이지
    const filePath = path.join(__dirname, "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  } else if (req.url === "/styles.css") {
    // CSS 파일 제공
    const filePath = path.join(__dirname, "styles.css");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end(data);
    });
  } else if (req.url === "/client.js") {
    // 클라이언트 JavaScript 파일 제공
    const filePath = path.join(__dirname, "client.js");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
        return;
      }
      res.writeHead(200, { "Content-Type": "application/javascript" });
      res.end(data);
    });
  } else {
    // 404 Not Found
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

// WebSocket 서버 설정
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("새 클라이언트가 연결되었습니다.");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (err) {
      console.error("메시지 처리 오류:", err);
    }
  });
});

// 서버 실행
server.listen(3000, () => {
  console.log(
    "HTTP 및 WebSocket 서버가 http://localhost:3000 에서 실행 중입니다."
  );
});
