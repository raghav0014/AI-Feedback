interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  id: string;
}

interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connectionHandlers: ConnectionHandler[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private shouldReconnect = true;

  constructor() {
    this.config = {
      url: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.notifyConnectionHandlers(false);
          this.stopHeartbeat();
          
          if (this.shouldReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.config.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send('heartbeat', { timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });

    // Handle global message handlers
    const globalHandlers = this.messageHandlers.get('*') || [];
    globalHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in global message handler:', error);
      }
    });
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  send(type: string, data: any): void {
    if (!this.isConnected || !this.ws) {
      console.warn('WebSocket not connected, message not sent:', type);
      return;
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      id: this.generateMessageId()
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }

  subscribe(messageType: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    
    this.messageHandlers.get(messageType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  private generateMessageId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Specific methods for different message types
  subscribeToReviewUpdates(handler: (review: any) => void): () => void {
    return this.subscribe('review_update', (message) => {
      handler(message.data);
    });
  }

  subscribeToNotifications(handler: (notification: any) => void): () => void {
    return this.subscribe('notification', (message) => {
      handler(message.data);
    });
  }

  subscribeToAnalyticsUpdates(handler: (analytics: any) => void): () => void {
    return this.subscribe('analytics_update', (message) => {
      handler(message.data);
    });
  }

  // Send specific message types
  joinRoom(roomId: string): void {
    this.send('join_room', { roomId });
  }

  leaveRoom(roomId: string): void {
    this.send('leave_room', { roomId });
  }

  sendReviewUpdate(reviewId: string, update: any): void {
    this.send('review_update', { reviewId, update });
  }

  sendUserActivity(activity: any): void {
    this.send('user_activity', activity);
  }
}

export const websocketService = new WebSocketService();
export type { WebSocketMessage, MessageHandler, ConnectionHandler };