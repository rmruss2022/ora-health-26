/**
 * WebSocket Client Service
 * Manages real-time connections for room updates, notifications, etc.
 */

type MessageHandler = (data: any) => void;

interface SubscriptionHandlers {
  [event: string]: MessageHandler[];
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private handlers: SubscriptionHandlers = {};
  private isConnecting = false;
  private isIntentionalClose = false;

  constructor(url: string = 'ws://localhost:4000') {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.token = token;
      this.isIntentionalClose = false;

      try {
        const wsUrl = `${this.url}?token=${token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.isConnecting = false;
          this.ws = null;

          // Auto-reconnect if not intentional close
          if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.token && !this.isIntentionalClose) {
        this.connect(this.token).catch((error) => {
          console.error('[WebSocket] Reconnect failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Send message to server
   */
  send(type: string, data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  }

  /**
   * Subscribe to a room
   */
  subscribeToRoom(roomId: string): void {
    this.send('subscribe', { room: `room:${roomId}` });
  }

  /**
   * Unsubscribe from a room
   */
  unsubscribeFromRoom(roomId: string): void {
    this.send('unsubscribe', { room: `room:${roomId}` });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: any): void {
    const { type, data } = message;
    
    if (this.handlers[type]) {
      this.handlers[type].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[WebSocket] Error in handler for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to event
   */
  on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    
    this.handlers[event].push(handler);

    // Return unsubscribe function
    return () => {
      this.handlers[event] = this.handlers[event].filter(h => h !== handler);
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
