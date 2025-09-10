import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNotifications as useWebSocketNotifications } from '../hooks/useWebSocket';

const NotificationContext = createContext(null);

let idSeq = 1;

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  
  // Get WebSocket notifications
  const { notifications: wsNotifications, unreadCount: wsUnreadCount } = useWebSocketNotifications();

  // Sync WebSocket notifications with local state
  useEffect(() => {
    if (wsNotifications.length > 0) {
      const newItems = wsNotifications.map(notif => ({
        id: notif._id || `ws-${idSeq++}`,
        type: notif.type || 'info',
        title: 'New Notification',
        message: notif.message || 'You have a new notification',
        ts: new Date(notif.createdAt).getTime(),
        read: notif.read || false,
        timeoutMs: 5000,
        action: notif.data?.postId ? {
          label: 'View',
          onPress: () => window.location.href = `/post/${notif.data.postId}`
        } : undefined,
      }));
      
      setItems(prev => [...newItems, ...prev]);
      setUnread(prev => prev + wsUnreadCount);
    }
  }, [wsNotifications, wsUnreadCount]);

  const push = useCallback((payload) => {
    const now = Date.now();
    const item = {
      id: idSeq++,
      type: payload.type || 'info',
      title: payload.title || undefined,
      message: payload.message || String(payload) || '',
      ts: now,
      read: false,
      timeoutMs: payload.timeoutMs ?? 3500,
      action: payload.action || undefined,
    };
    setItems((prev) => [...prev, item]);
    setUnread((u) => u + 1);
    return item.id;
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }, []);

  const value = useMemo(() => ({
    notify: (opts) => push(opts),
    success: (message, opts = {}) => push({ ...opts, type: 'success', message }),
    error: (message, opts = {}) => push({ ...opts, type: 'error', message }),
    info: (message, opts = {}) => push({ ...opts, type: 'info', message }),
    warning: (message, opts = {}) => push({ ...opts, type: 'warning', message }),
    items,
    unread,
    markAllRead,
    remove,
  }), [items, unread, markAllRead, remove, push]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onAutoClose={remove} />
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider');
  return ctx;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return { items: ctx.items, unread: ctx.unread, markAllRead: ctx.markAllRead };
}

function ToastViewport({ items, onAutoClose }) {
  return (
    <div style={viewportStyle}>
      {items.map((n) => (
        <Toast key={n.id} n={n} onDone={() => onAutoClose(n.id)} />
      ))}
    </div>
  );
}

function Toast({ n, onDone }) {
  const [life, setLife] = useState(0);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const total = Math.max(1200, n.timeoutMs || 3500);
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      setLife(Math.min(100, Math.round((elapsed / total) * 100)));
      if (elapsed >= total) {
        clearInterval(id);
        onDone();
      }
    }, 50);
    return () => clearInterval(id);
  }, [n.timeoutMs, onDone]);

  const color = n.type === 'success' ? '#10b981'
    : n.type === 'error' ? '#ef4444'
    : n.type === 'warning' ? '#f59e0b'
    : '#3b82f6';

  return (
    <div style={{ ...toastStyle, borderLeft: `4px solid ${color}` }}>
      <div style={rowStyle}>
        <div style={{ ...iconDotStyle, background: color }} />
        <div style={{ flex: 1, paddingRight: 8 }}>
          {n.title ? <div style={titleStyle}>{n.title}</div> : null}
          <div style={msgStyle}>{n.message}</div>
        </div>
        {n.action ? (
          <button style={actionBtnStyle} onClick={() => { try { n.action.onPress?.(); } finally { onDone(); } }}>{n.action.label}</button>
        ) : null}
      </div>
      <div style={barWrapStyle}>
        <div style={{ ...barStyle, width: `${100 - life}%`, background: color }} />
      </div>
    </div>
  );
}

const viewportStyle = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 12,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  zIndex: 2000,
  pointerEvents: 'none',
};

const toastStyle = {
  width: 'min(92vw, 540px)',
  background: 'rgba(17,17,17,0.92)',
  color: '#fff',
  borderRadius: 12,
  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
  padding: 12,
  pointerEvents: 'auto',
  backdropFilter: 'blur(6px)',
};

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const iconDotStyle = {
  width: 10,
  height: 10,
  borderRadius: 999,
  marginRight: 2,
  filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.25))',
};

const titleStyle = {
  fontWeight: 700,
  marginBottom: 2,
};

const msgStyle = {
  opacity: 0.95,
  lineHeight: 1.35,
};

const barWrapStyle = {
  height: 3,
  background: 'rgba(255,255,255,0.08)',
  borderRadius: 999,
  overflow: 'hidden',
  marginTop: 8,
};

const barStyle = {
  height: '100%',
  transition: 'width 50ms linear',
};

const actionBtnStyle = {
  background: 'rgba(255,255,255,0.12)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '6px 10px',
  cursor: 'pointer',
};

export function NotificationsDropdown() {
  const { items, markAllRead } = useNotifications();
  return (
    <div className="card shadow-sm" style={{ position: 'absolute', right: 0, top: '110%', width: 320, zIndex: 1500 }}>
      <div className="card-body p-2">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <strong>Notifications</strong>
          <button className="btn btn-sm btn-outline-secondary" onClick={markAllRead}>Mark all read</button>
        </div>
        <div className="list-group list-group-flush">
          {items.slice().reverse().slice(0, 10).map((n) => (
            <div key={n.id} className="list-group-item" style={{ border: 'none' }}>
              <div className="d-flex gap-2">
                <span className={`badge rounded-pill bg-${n.type === 'success' ? 'success' : n.type === 'error' ? 'danger' : n.type === 'warning' ? 'warning text-dark' : 'primary'}`}>•</span>
                <div>
                  {n.title ? <div className="fw-semibold">{n.title}</div> : null}
                  <div style={{ opacity: 0.9 }}>{n.message}</div>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center text-muted py-3">No notifications yet</div>}
        </div>
      </div>
    </div>
  );
}


