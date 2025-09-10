import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useWebSocket';
import { Bell, X, Check } from 'react-icons/fa';

const NotificationCenter = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👥';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    
    // Navigate to relevant content if needed
    if (notification.data?.postId) {
      window.location.href = `/post/${notification.data.postId}`;
    }
  };

  return (
    <div className="position-relative">
      {/* Notification Bell */}
      <button
        className="btn btn-link text-decoration-none position-relative"
        onClick={() => setIsOpen(!isOpen)}
        style={{ color: 'white', fontSize: '1.2rem' }}
      >
        <Bell />
        {unreadCount > 0 && (
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.7rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div 
          className="position-absolute bg-dark border border-secondary rounded shadow-lg"
          style={{
            top: '100%',
            right: '0',
            width: '350px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1050
          }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
            <h6 className="mb-0 text-white">Notifications</h6>
            <div className="d-flex gap-2">
              {unreadCount > 0 && (
                <button
                  className="btn btn-sm btn-outline-success"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <Check size={12} />
                </button>
              )}
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="p-0">
            {notifications.length === 0 ? (
              <div className="p-3 text-center text-muted">
                <Bell size={24} className="mb-2" />
                <p className="mb-0">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-3 border-bottom border-secondary cursor-pointer ${
                    !notification.read ? 'bg-primary bg-opacity-10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className="fs-4">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow-1">
                      <p className="mb-1 text-white small">
                        {notification.message}
                      </p>
                      <small className="text-muted">
                        {formatTime(notification.createdAt)}
                      </small>
                    </div>
                    {!notification.read && (
                      <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-top border-secondary text-center">
              <small className="text-muted">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </small>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1040 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationCenter;
