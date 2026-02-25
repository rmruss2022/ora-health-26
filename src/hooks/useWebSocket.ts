import { useEffect, useCallback, useContext } from 'react';
import { wsClient } from '../services/websocket.client';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook for using WebSocket in components
 */
export const useWebSocket = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user?.token) {
      wsClient.connect(user.token).catch(error => {
        console.error('Failed to connect WebSocket:', error);
      });
    }

    return () => {
      wsClient.disconnect();
    };
  }, [user?.token]);

  const subscribeToRoom = useCallback((roomId: string) => {
    wsClient.subscribeToRoom(roomId);
  }, []);

  const unsubscribeFromRoom = useCallback((roomId: string) => {
    wsClient.unsubscribeFromRoom(roomId);
  }, []);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    return wsClient.on(event, handler);
  }, []);

  return {
    subscribeToRoom,
    unsubscribeFromRoom,
    on,
    isConnected: wsClient.isConnected(),
  };
};
