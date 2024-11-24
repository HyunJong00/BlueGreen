const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const server = http.createServer((req, res) => {
  let filePath = "";

  if (req.url === "/" || req.url === "/main") {
    filePath = path.join(__dirname, "main.html");
  } else if (req.url === "/detection") {
    filePath = path.join(__dirname, "detection.html");
  } else if (req.url === "/webrtc") {
    filePath = path.join(__dirname, "video.html");
  } else if (req.url === "/styles.css") {
    filePath = path.join(__dirname, "styles.css");
  } else if (req.url === "/client.js") {
    filePath = path.join(__dirname, "client.js");
  } else if (req.url === "/script.js") {
    filePath = path.join(__dirname, "script.js");
  } else if (req.url === "/face-api.min.js") {
    filePath = path.join(__dirname, "face-api.min.js");
  } else if (req.url.startsWith("/models")) {
    filePath = path.join(__dirname, req.url);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("500 Internal Server Error");
      return;
    }

    const ext = path.extname(filePath);
    const contentType =
      ext === ".html"
        ? "text/html"
        : ext === ".css"
        ? "text/css"
        : ext === ".js"
        ? "application/javascript"
        : "text/plain";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "chat") {
        // 수정: chat 메시지 처리
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "chat", message: data.message }));
          }
        });
      } else {
        // 수정: WebRTC signaling 메시지 처리
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  });
});


server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
