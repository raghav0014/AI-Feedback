import { WebSocketServer } from 'ws';

let wss;

export const setupWebSocket = (server) => {
  wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleWebSocketMessage(ws, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      data: { message: 'Connected to FeedbackChain WebSocket' },
      timestamp: Date.now()
    }));
  });

  console.log('🔌 WebSocket server initialized');
};

const handleWebSocketMessage = (ws, data) => {
  switch (data.type) {
    case 'heartbeat':
      ws.send(JSON.stringify({
        type: 'heartbeat_ack',
        data: { timestamp: Date.now() },
        timestamp: Date.now()
      }));
      break;
    
    case 'join_room':
      // Handle room joining logic
      ws.room = data.data.roomId;
      break;
    
    case 'leave_room':
      // Handle room leaving logic
      delete ws.room;
      break;
    
    default:
      console.log('Unknown WebSocket message type:', data.type);
  }
};

export const broadcastToAll = (message) => {
  if (!wss) return;
  
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(message));
    }
  });
};

export const broadcastToRoom = (roomId, message) => {
  if (!wss) return;
  
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.room === roomId) {
      client.send(JSON.stringify(message));
    }
  });
};