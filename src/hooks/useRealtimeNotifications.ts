import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SSEEvent {
  type: 'connected' | 'notification' | 'heartbeat';
  message?: string;
  notification?: any;
  timestamp?: number;
}

export function useRealtimeNotifications() {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!token) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      const eventSource = new EventSource(`/api/notifications/stream`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              console.log('SSE connected:', data.message);
              break;
            case 'notification':
              // Dispatch custom event for notification
              window.dispatchEvent(new CustomEvent('realtimeNotification', {
                detail: data.notification
              }));
              break;
            case 'heartbeat':
              // Connection is alive
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        setConnectionError('Connection lost');
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
            connect();
          }, delay);
        } else {
          setConnectionError('Failed to reconnect after multiple attempts');
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      setConnectionError('Failed to create connection');
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
    reconnectAttempts.current = 0;
  };

  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token]);

  return {
    isConnected,
    connectionError,
    reconnect: connect,
    disconnect
  };
}
