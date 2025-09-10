import { io } from 'socket.io-client';
import API_BASE_URL from '../utils/config';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  connect() {
    if (this.socket && this.isConnected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    try {
      // Extract the base URL without /api
      const baseUrl = API_BASE_URL.replace('/api', '');
      const wsUrl = baseUrl.replace('http', 'ws');
      
      console.log('[WebSocket] Connecting to:', wsUrl);
      
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 10000,
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('[WebSocket] Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed after', this.maxReconnectAttempts, 'attempts');
    });

    // Content update events
    this.socket.on('content_update', (data) => {
      console.log('[WebSocket] Content update received:', data);
      this.handleContentUpdate(data);
    });

    // Notification events
    this.socket.on('notification', (data) => {
      console.log('[WebSocket] Notification received:', data);
      this.handleNotification(data);
    });
  }

  handleContentUpdate(data) {
    // Emit custom event for content updates
    const event = new CustomEvent('websocket:content_update', { detail: data });
    window.dispatchEvent(event);
  }

  handleNotification(data) {
    // Emit custom event for notifications
    const event = new CustomEvent('websocket:notification', { detail: data });
    window.dispatchEvent(event);
  }

  disconnect() {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Send a message to the server
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[WebSocket] Cannot emit message - not connected');
    }
  }

  // Subscribe to an event
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Unsubscribe from an event
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService;
