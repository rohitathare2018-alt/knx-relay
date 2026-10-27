const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('KNX Relay Active');
});

const wss = new WebSocket.Server({ server });

let laptop = null;
let esp32 = null;

wss.on('connection', (ws, req) => {
  const path = req.url;

  if (path === '/laptop') {
    if (laptop) laptop.terminate();
    laptop = ws;
    console.log('[CONNECT] Laptop joined');
  } else if (path === '/esp32') {
    if (esp32) esp32.terminate();
    esp32 = ws;
    console.log('[CONNECT] ESP32 joined');
  }

  ws.on('message', (data) => {
    if (ws === laptop && esp32 && esp32.readyState === WebSocket.OPEN) {
      esp32.send(data);
    } else if (ws === esp32 && laptop && laptop.readyState === WebSocket.OPEN) {
      laptop.send(data);
    }
  });

  ws.on('close', () => {
    if (ws === laptop) laptop = null;
    if (ws === esp32) esp32 = null;
  });

  ws.on('error', () => {});
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Relay running on port ${PORT}`);
});
