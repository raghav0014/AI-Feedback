import { useEffect, useRef, useState } from 'react';
import { websocketService, WebSocketMessage, MessageHandler } from '../services/websocketService';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const subscriptionsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Subscribe to connection changes
    const unsubscribeConnection = websocketService.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        setConnectionError(null);
      }
    });

    // Attempt to connect
    websocketService.connect().catch((error) => {
      setConnectionError(error.message);
    });

    // Cleanup on unmount
    return () => {
      unsubscribeConnection();
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      websocketService.disconnect();
    };
  }, []);

  const subscribe = (messageType: string, handler: MessageHandler) => {
    const unsubscribe = websocketService.subscribe(messageType, handler);
    subscriptionsRef.current.push(unsubscribe);
    return unsubscribe;
  };

  const send = (type: string, data: any) => {
    websocketService.send(type, data);
  };

  return {
    isConnected,
    connectionError,
    subscribe,
    send,
    joinRoom: websocketService.joinRoom.bind(websocketService),
    leaveRoom: websocketService.leaveRoom.bind(websocketService),
    subscribeToReviewUpdates: websocketService.subscribeToReviewUpdates.bind(websocketService),
    subscribeToNotifications: websocketService.subscribeToNotifications.bind(websocketService),
    subscribeToAnalyticsUpdates: websocketService.subscribeToAnalyticsUpdates.bind(websocketService)
  };
}