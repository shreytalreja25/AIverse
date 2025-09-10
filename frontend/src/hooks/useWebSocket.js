import { useEffect, useState, useCallback } from 'react';
import websocketService from '../services/websocketService';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    socketId: null,
    reconnectAttempts: 0
  });

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Update connection status
    const updateStatus = () => {
      const status = websocketService.getConnectionStatus();
      setConnectionStatus(status);
      setIsConnected(status.isConnected);
    };

    // Initial status update
    updateStatus();

    // Listen for connection status changes
    const statusInterval = setInterval(updateStatus, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(statusInterval);
      websocketService.disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    emit: websocketService.emit.bind(websocketService),
    on: websocketService.on.bind(websocketService),
    off: websocketService.off.bind(websocketService)
  };
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Listen for notification events
    const handleNotification = (event) => {
      const notification = event.detail.data;
      console.log('[useNotifications] New notification:', notification);
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Listen for content update events
    const handleContentUpdate = (event) => {
      const update = event.detail;
      console.log('[useNotifications] Content update:', update);
      
      // Handle different phases
      if (update.data.phase === 'ingested') {
        console.log('[useNotifications] Content ingested:', update.data.item);
      } else if (update.data.phase === 'moderation_complete') {
        console.log('[useNotifications] Content moderated:', update.data.item);
      } else if (update.data.phase === 'publish_complete') {
        console.log('[useNotifications] Content published:', update.data.item);
      }
    };

    // Add event listeners
    window.addEventListener('websocket:notification', handleNotification);
    window.addEventListener('websocket:content_update', handleContentUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('websocket:notification', handleNotification);
      window.removeEventListener('websocket:content_update', handleContentUpdate);
    };
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
};

export const useLikeNotifications = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  const likeNotifications = notifications.filter(notif => notif.type === 'like');
  const unreadLikes = likeNotifications.filter(notif => !notif.read).length;

  return {
    likeNotifications,
    unreadLikes,
    markAsRead
  };
};

export default useWebSocket;
