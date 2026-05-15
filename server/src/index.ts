import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
console.log('WebSocket server running on ws://localhost:8080');

// Heartbeat interval to keep connections alive
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  });
}, 30000);

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send a welcome message
  ws.send(JSON.stringify({ type: 'connected', message: 'Real-time feed active' }));

  // Simulate new transactions every 5-8 seconds
  const sendTransaction = () => {
    const transaction = {
      id: `t${Date.now()}`,
      amount: Math.round(Math.random() * 1000 * 100) / 100,
      currency: 'USD',
      type: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'][Math.floor(Math.random() * 3)],
      description: ['Salary', 'ATM withdrawal', 'Online purchase', 'Interest'][Math.floor(Math.random() * 4)],
      createdAt: new Date().toISOString(),
      sourceAccountId: `a${Math.floor(Math.random() * 2) + 1}`,
      destinationAccountId: `a${Math.floor(Math.random() * 2) + 1}`,
    };
    ws.send(JSON.stringify({ type: 'new_transaction', transaction }));
  };

  const transactionTimer = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      sendTransaction();
    }
  }, 5000 + Math.random() * 3000);

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(transactionTimer);
  });
});

// Clean up heartbeat on server close
wss.on('close', () => clearInterval(interval));