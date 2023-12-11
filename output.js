const fs = require('fs');
const express = require('express');
const https = require('https');
const readline = require('readline'); // readlineモジュールの追加
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');

const app = express();

// HTTPS設定
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
};

// HTTPSサーバーの作成
const server = https.createServer(httpsOptions, app);

// WebSocketサーバーの作成
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    const child = spawn('./inspector');

    const rl = readline.createInterface({ input: child.stdout }); // readlineインターフェースの作成

    rl.on('line', (line) => {
        console.log(line);
        ws.send(line); // 最新の行のみを送信
    });

    child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    child.on('close', (code) => {
        console.log(`Child process exited with code ${code}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        child.kill();
    });
});

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'public')));

// 特定のパスでHTMLファイルを提供
app.get('/mac_ar_monitor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mac_ar_monitor.html'));
});

// HTTPSサーバーの起動
server.listen(3000, () => {
  console.log('HTTPS and WebSocket server started on https://localhost:3000');
});
