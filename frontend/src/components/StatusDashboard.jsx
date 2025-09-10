import { useState, useEffect, useRef } from 'react';
import { useNotify } from './Notify.jsx';
import API_BASE_URL from '../utils/config';
import websocketService from '../services/websocketService';

export default function StatusDashboard() {
  const { success, error: notifyError, warning } = useNotify();
  const [backendStatus, setBackendStatus] = useState({
    status: 'checking',
    version: 'Unknown',
    node: 'Unknown',
    environment: 'Unknown',
    uptime: 0,
    memory: { rss: 0, heapUsed: 0 },
    timestamp: null,
    latency: 0
  });
  
  const [websocketStatus, setWebsocketStatus] = useState({
    connected: false,
    socketId: null,
    reconnectAttempts: 0,
    lastConnected: null,
    connectionTime: 0
  });
  
  const [locationPermission, setLocationPermission] = useState({
    granted: false,
    denied: false,
    unavailable: false,
    coordinates: null,
    city: null,
    country: null
  });
  
  const [cameraPermission, setCameraPermission] = useState({
    granted: false,
    denied: false,
    unavailable: false
  });
  
  const [microphonePermission, setMicrophonePermission] = useState({
    granted: false,
    denied: false,
    unavailable: false
  });
  
  const [videoPermission, setVideoPermission] = useState({
    granted: false,
    denied: false,
    unavailable: false
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef(null);
  const wsConnectionTimeRef = useRef(null);

  // Check backend status
  const checkBackendStatus = async () => {
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        setBackendStatus({
          status: 'up',
          version: data.version || 'Unknown',
          node: data.node || 'Unknown',
          environment: data.environment || 'Unknown',
          uptime: data.uptime || 0,
          memory: {
            rss: data.rss || 0,
            heapUsed: data.heapUsed || 0
          },
          timestamp: data.timestamp || new Date().toISOString(),
          latency: latency
        });
      } else {
        setBackendStatus(prev => ({
          ...prev,
          status: 'error',
          latency: latency
        }));
      }
    } catch (error) {
      console.error('Backend status check failed:', error);
      setBackendStatus(prev => ({
        ...prev,
        status: 'down',
        latency: 0
      }));
    }
  };

  // Check WebSocket status
  const checkWebSocketStatus = () => {
    const status = websocketService.getConnectionStatus();
    const now = new Date();
    
    setWebsocketStatus(prev => ({
      ...prev,
      connected: status.isConnected,
      socketId: status.socketId,
      reconnectAttempts: status.reconnectAttempts,
      lastConnected: status.isConnected ? now : prev.lastConnected,
      connectionTime: status.isConnected && wsConnectionTimeRef.current 
        ? Math.floor((now - wsConnectionTimeRef.current) / 1000)
        : 0
    }));

    if (status.isConnected && !wsConnectionTimeRef.current) {
      wsConnectionTimeRef.current = now;
    } else if (!status.isConnected) {
      wsConnectionTimeRef.current = null;
    }
  };

  // Check location permission
  const checkLocationPermission = () => {
    if (!navigator.geolocation) {
      setLocationPermission(prev => ({
        ...prev,
        unavailable: true
      }));
      return;
    }

    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      setLocationPermission(prev => ({
        ...prev,
        granted: result.state === 'granted',
        denied: result.state === 'denied'
      }));
    }).catch(() => {
      // Fallback for browsers that don't support permissions API
      setLocationPermission(prev => ({
        ...prev,
        granted: false,
        denied: false
      }));
    });
  };

  // Check camera permission
  const checkCameraPermission = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermission(prev => ({
        ...prev,
        unavailable: true
      }));
      return;
    }

    navigator.permissions.query({ name: 'camera' }).then((result) => {
      setCameraPermission(prev => ({
        ...prev,
        granted: result.state === 'granted',
        denied: result.state === 'denied'
      }));
    }).catch(() => {
      setCameraPermission(prev => ({
        ...prev,
        granted: false,
        denied: false
      }));
    });
  };

  // Check microphone permission
  const checkMicrophonePermission = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicrophonePermission(prev => ({
        ...prev,
        unavailable: true
      }));
      return;
    }

    navigator.permissions.query({ name: 'microphone' }).then((result) => {
      setMicrophonePermission(prev => ({
        ...prev,
        granted: result.state === 'granted',
        denied: result.state === 'denied'
      }));
    }).catch(() => {
      setMicrophonePermission(prev => ({
        ...prev,
        granted: false,
        denied: false
      }));
    });
  };

  // Check video permission (combination of camera and microphone)
  const checkVideoPermission = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVideoPermission(prev => ({
        ...prev,
        unavailable: true
      }));
      return;
    }

    // Video requires both camera and microphone
    const cameraGranted = cameraPermission.granted;
    const micGranted = microphonePermission.granted;
    
    setVideoPermission(prev => ({
      ...prev,
      granted: cameraGranted && micGranted,
      denied: cameraPermission.denied || microphonePermission.denied
    }));
  };

  // Request location permission
  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      warning('Geolocation is not supported by this browser');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get city and country from coordinates
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          setLocationPermission(prev => ({
            ...prev,
            granted: true,
            denied: false,
            coordinates: { latitude, longitude },
            city: data.city || data.locality || 'Unknown',
            country: data.countryName || 'Unknown'
          }));
          
          success('Location access granted!');
        } catch (error) {
          console.error('Error getting location details:', error);
          setLocationPermission(prev => ({
            ...prev,
            granted: true,
            denied: false,
            coordinates: { latitude, longitude },
            city: 'Unknown',
            country: 'Unknown'
          }));
          success('Location access granted!');
        }
      },
      (error) => {
        console.error('Location access denied:', error);
        setLocationPermission(prev => ({
          ...prev,
          granted: false,
          denied: true
        }));
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            notifyError('Location access denied by user');
            break;
          case error.POSITION_UNAVAILABLE:
            notifyError('Location information unavailable');
            break;
          case error.TIMEOUT:
            notifyError('Location request timed out');
            break;
          default:
            notifyError('An unknown error occurred while requesting location');
            break;
        }
      },
      options
    );
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      warning('Camera access is not supported by this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately as we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      
      setCameraPermission(prev => ({
        ...prev,
        granted: true,
        denied: false
      }));
      
      // Save to localStorage
      localStorage.setItem('cameraPermission', 'granted');
      success('Camera access granted!');
    } catch (error) {
      console.error('Camera access denied:', error);
      setCameraPermission(prev => ({
        ...prev,
        granted: false,
        denied: true
      }));
      
      localStorage.setItem('cameraPermission', 'denied');
      notifyError('Camera access denied. Please enable camera permissions in your browser settings.');
    }
  };

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      warning('Microphone access is not supported by this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately as we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      
      setMicrophonePermission(prev => ({
        ...prev,
        granted: true,
        denied: false
      }));
      
      // Save to localStorage
      localStorage.setItem('microphonePermission', 'granted');
      success('Microphone access granted!');
    } catch (error) {
      console.error('Microphone access denied:', error);
      setMicrophonePermission(prev => ({
        ...prev,
        granted: false,
        denied: true
      }));
      
      localStorage.setItem('microphonePermission', 'denied');
      notifyError('Microphone access denied. Please enable microphone permissions in your browser settings.');
    }
  };

  // Request video permission (camera + microphone)
  const requestVideoPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      warning('Video recording is not supported by this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Stop the stream immediately as we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      
      setVideoPermission(prev => ({
        ...prev,
        granted: true,
        denied: false
      }));
      
      setCameraPermission(prev => ({
        ...prev,
        granted: true,
        denied: false
      }));
      
      setMicrophonePermission(prev => ({
        ...prev,
        granted: true,
        denied: false
      }));
      
      // Save to localStorage
      localStorage.setItem('videoPermission', 'granted');
      localStorage.setItem('cameraPermission', 'granted');
      localStorage.setItem('microphonePermission', 'granted');
      success('Video recording access granted!');
    } catch (error) {
      console.error('Video access denied:', error);
      setVideoPermission(prev => ({
        ...prev,
        granted: false,
        denied: true
      }));
      
      localStorage.setItem('videoPermission', 'denied');
      notifyError('Video recording access denied. Please enable camera and microphone permissions in your browser settings.');
    }
  };

  // Load permissions from localStorage
  const loadPermissionsFromStorage = () => {
    const cameraPerm = localStorage.getItem('cameraPermission');
    const micPerm = localStorage.getItem('microphonePermission');
    const videoPerm = localStorage.getItem('videoPermission');
    
    if (cameraPerm === 'granted') {
      setCameraPermission(prev => ({ ...prev, granted: true }));
    } else if (cameraPerm === 'denied') {
      setCameraPermission(prev => ({ ...prev, denied: true }));
    }
    
    if (micPerm === 'granted') {
      setMicrophonePermission(prev => ({ ...prev, granted: true }));
    } else if (micPerm === 'denied') {
      setMicrophonePermission(prev => ({ ...prev, denied: true }));
    }
    
    if (videoPerm === 'granted') {
      setVideoPermission(prev => ({ ...prev, granted: true }));
    } else if (videoPerm === 'denied') {
      setVideoPermission(prev => ({ ...prev, denied: true }));
    }
  };

  // Refresh all statuses
  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      checkBackendStatus(),
      checkWebSocketStatus(),
      checkLocationPermission(),
      checkCameraPermission(),
      checkMicrophonePermission(),
      checkVideoPermission()
    ]);
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    // Load permissions from storage first
    loadPermissionsFromStorage();
    
    // Initial check
    refreshAll();
    
    // Set up interval
    intervalRef.current = setInterval(() => {
      checkBackendStatus();
      checkWebSocketStatus();
    }, 30000);

    // Set up WebSocket event listeners
    const handleWebSocketConnect = () => {
      checkWebSocketStatus();
    };

    const handleWebSocketDisconnect = () => {
      checkWebSocketStatus();
    };

    window.addEventListener('websocket:connect', handleWebSocketConnect);
    window.addEventListener('websocket:disconnect', handleWebSocketDisconnect);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('websocket:connect', handleWebSocketConnect);
      window.removeEventListener('websocket:disconnect', handleWebSocketDisconnect);
    };
  }, []);

  // Format uptime
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  // Format memory
  const formatMemory = (mb) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="status-dashboard">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-light mb-0">
          <i className="fas fa-chart-line text-primary me-2"></i>
          System Status
        </h4>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={refreshAll}
          disabled={isRefreshing}
        >
          <i className={`fas fa-sync-alt ${isRefreshing ? 'fa-spin' : ''} me-1`}></i>
          Refresh
        </button>
      </div>

      {/* Status Cards */}
      <div className="row g-3 mb-4">
        {/* Backend Status */}
        <div className="col-md-6">
          <div className="card bg-dark border-0 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="text-light mb-0">
                  <i className="fas fa-server me-2"></i>
                  Backend Server
                </h6>
                <span className={`badge ${
                  backendStatus.status === 'up' ? 'bg-success' :
                  backendStatus.status === 'checking' ? 'bg-warning' :
                  'bg-danger'
                }`}>
                  {backendStatus.status === 'up' ? 'UP' :
                   backendStatus.status === 'checking' ? 'CHECKING' :
                   'DOWN'}
                </span>
              </div>
              
              <div className="row g-2">
                <div className="col-6">
                  <small className="text-muted">Version</small>
                  <div className="text-light fw-bold">{backendStatus.version}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted">Node</small>
                  <div className="text-light fw-bold">{backendStatus.node}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted">Environment</small>
                  <div className="text-light fw-bold">{backendStatus.environment}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted">Latency</small>
                  <div className="text-light fw-bold">{backendStatus.latency}ms</div>
                </div>
                <div className="col-6">
                  <small className="text-muted">Uptime</small>
                  <div className="text-light fw-bold">{formatUptime(backendStatus.uptime)}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted">Memory</small>
                  <div className="text-light fw-bold">{formatMemory(backendStatus.memory.rss)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WebSocket Status */}
        <div className="col-md-6">
          <div className="card bg-dark border-0 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="text-light mb-0">
                  <i className="fas fa-plug me-2"></i>
                  WebSocket
                </h6>
                <span className={`badge ${websocketStatus.connected ? 'bg-success' : 'bg-danger'}`}>
                  {websocketStatus.connected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
              
              <div className="row g-2">
                <div className="col-6">
                  <small className="text-muted">Socket ID</small>
                  <div className="text-light fw-bold small">
                    {websocketStatus.socketId ? websocketStatus.socketId.substring(0, 8) + '...' : 'N/A'}
                  </div>
                </div>
                <div className="col-6">
                  <small className="text-muted">Reconnect Attempts</small>
                  <div className="text-light fw-bold">{websocketStatus.reconnectAttempts}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted">Connection Time</small>
                  <div className="text-light fw-bold">
                    {websocketStatus.connectionTime > 0 ? formatUptime(websocketStatus.connectionTime) : 'N/A'}
                  </div>
                </div>
                <div className="col-6">
                  <small className="text-muted">Last Connected</small>
                  <div className="text-light fw-bold small">
                    {websocketStatus.lastConnected ? 
                      websocketStatus.lastConnected.toLocaleTimeString() : 'Never'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Permission */}
      <div className="card bg-dark border-0 mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="text-light mb-0">
              <i className="fas fa-map-marker-alt me-2"></i>
              Location Access
            </h6>
            <span className={`badge ${
              locationPermission.granted ? 'bg-success' :
              locationPermission.denied ? 'bg-danger' :
              locationPermission.unavailable ? 'bg-secondary' :
              'bg-warning'
            }`}>
              {locationPermission.granted ? 'GRANTED' :
               locationPermission.denied ? 'DENIED' :
               locationPermission.unavailable ? 'UNAVAILABLE' :
               'UNKNOWN'}
            </span>
          </div>
          
          {locationPermission.granted && locationPermission.coordinates ? (
            <div className="row g-2">
              <div className="col-md-4">
                <small className="text-muted">City</small>
                <div className="text-light fw-bold">{locationPermission.city}</div>
              </div>
              <div className="col-md-4">
                <small className="text-muted">Country</small>
                <div className="text-light fw-bold">{locationPermission.country}</div>
              </div>
              <div className="col-md-4">
                <small className="text-muted">Coordinates</small>
                <div className="text-light fw-bold small">
                  {locationPermission.coordinates.latitude.toFixed(4)}, {locationPermission.coordinates.longitude.toFixed(4)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-muted mb-3">
                {locationPermission.unavailable 
                  ? 'Location services are not available on this device'
                  : 'Location access is required for location-based features'
                }
              </p>
              {!locationPermission.unavailable && (
                <button
                  className="btn btn-primary"
                  onClick={requestLocationPermission}
                >
                  <i className="fas fa-location-arrow me-2"></i>
                  Grant Location Access
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Permissions */}
      <div className="row g-3 mb-4">
        {/* Camera Permission */}
        <div className="col-md-4">
          <div className="card bg-dark border-0 h-100">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="text-light mb-0">
                  <i className="fas fa-camera me-2"></i>
                  Camera
                </h6>
                <span className={`badge ${
                  cameraPermission.granted ? 'bg-success' :
                  cameraPermission.denied ? 'bg-danger' :
                  cameraPermission.unavailable ? 'bg-secondary' :
                  'bg-warning'
                }`}>
                  {cameraPermission.granted ? 'GRANTED' :
                   cameraPermission.denied ? 'DENIED' :
                   cameraPermission.unavailable ? 'UNAVAILABLE' :
                   'UNKNOWN'}
                </span>
              </div>
              
              <p className="text-muted small mb-3">
                Required for photo capture and video recording
              </p>
              
              {!cameraPermission.granted && !cameraPermission.unavailable && (
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={requestCameraPermission}
                >
                  <i className="fas fa-camera me-1"></i>
                  Grant Access
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Microphone Permission */}
        <div className="col-md-4">
          <div className="card bg-dark border-0 h-100">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="text-light mb-0">
                  <i className="fas fa-microphone me-2"></i>
                  Microphone
                </h6>
                <span className={`badge ${
                  microphonePermission.granted ? 'bg-success' :
                  microphonePermission.denied ? 'bg-danger' :
                  microphonePermission.unavailable ? 'bg-secondary' :
                  'bg-warning'
                }`}>
                  {microphonePermission.granted ? 'GRANTED' :
                   microphonePermission.denied ? 'DENIED' :
                   microphonePermission.unavailable ? 'UNAVAILABLE' :
                   'UNKNOWN'}
                </span>
              </div>
              
              <p className="text-muted small mb-3">
                Required for voice messages and video recording
              </p>
              
              {!microphonePermission.granted && !microphonePermission.unavailable && (
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={requestMicrophonePermission}
                >
                  <i className="fas fa-microphone me-1"></i>
                  Grant Access
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Permission */}
        <div className="col-md-4">
          <div className="card bg-dark border-0 h-100">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="text-light mb-0">
                  <i className="fas fa-video me-2"></i>
                  Video Recording
                </h6>
                <span className={`badge ${
                  videoPermission.granted ? 'bg-success' :
                  videoPermission.denied ? 'bg-danger' :
                  videoPermission.unavailable ? 'bg-secondary' :
                  'bg-warning'
                }`}>
                  {videoPermission.granted ? 'GRANTED' :
                   videoPermission.denied ? 'DENIED' :
                   videoPermission.unavailable ? 'UNAVAILABLE' :
                   'UNKNOWN'}
                </span>
              </div>
              
              <p className="text-muted small mb-3">
                Requires both camera and microphone access
              </p>
              
              {!videoPermission.granted && !videoPermission.unavailable && (
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={requestVideoPermission}
                >
                  <i className="fas fa-video me-1"></i>
                  Grant Access
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="card bg-dark border-0">
        <div className="card-body">
          <h6 className="text-light mb-3">
            <i className="fas fa-chart-bar me-2"></i>
            System Statistics
          </h6>
          
          <div className="row g-3">
            <div className="col-md-3">
              <div className="text-center">
                <div className="text-primary fs-4 fw-bold">
                  {backendStatus.memory.heapUsed > 0 ? formatMemory(backendStatus.memory.heapUsed) : 'N/A'}
                </div>
                <small className="text-muted">Heap Used</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <div className="text-success fs-4 fw-bold">
                  {backendStatus.latency}ms
                </div>
                <small className="text-muted">Response Time</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <div className="text-warning fs-4 fw-bold">
                  {websocketStatus.reconnectAttempts}
                </div>
                <small className="text-muted">Reconnect Attempts</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <div className="text-info fs-4 fw-bold">
                  {lastUpdate.toLocaleTimeString()}
                </div>
                <small className="text-muted">Last Update</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
