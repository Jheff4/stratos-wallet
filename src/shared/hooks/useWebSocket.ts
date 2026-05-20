import { useEffect, useRef, useCallback } from 'react';
import { useChaos } from '@chaos/ChaosContext';

type MessageHandler = (data: any) => void;

export function useWebSocket(
  url: string,
  onMessage: MessageHandler,
) {
  const { config } = useChaos();

  const wsRef = useRef<WebSocket | null>(null);

  const reconnectTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const pingIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const reconnectAttemptsRef = useRef(0);

  const onMessageRef = useRef(onMessage);

  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const ws = new WebSocket(url);

    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');

      reconnectAttemptsRef.current = 0;

      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'ping',
            }),
          );
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // -------------------------------------------------
        // Chaos Simulation: Random Message Drop
        // -------------------------------------------------

        if (Math.random() < config.messageDropRate) {
          console.warn('[WS] Message dropped');

          return;
        }

        // -------------------------------------------------
        // Chaos Simulation: Duplicate Events
        // -------------------------------------------------

        if (
          config.duplicateWsEvents &&
          Math.random() < 0.5
        ) {
          setTimeout(() => {
            onMessageRef.current(data);
          }, 100);
        }

        onMessageRef.current(data);
      } catch (error) {
        console.error('[WS] Invalid message', error);
      }
    };

    ws.onclose = (event) => {
      console.log(
        '[WS] Disconnected',
        event.code,
        event.reason,
      );

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      // -------------------------------------------------
      // Exponential Backoff Reconnection
      // -------------------------------------------------

      const reconnectDelay = Math.min(
        1000 * 2 ** reconnectAttemptsRef.current,
        30000,
      );

      reconnectAttemptsRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectDelay);
    };

    ws.onerror = (error) => {
      console.error('[WS] Error', error);

      ws.close();
    };
  }, [
    url,
    config.duplicateWsEvents,
    config.messageDropRate,
  ]);

  // -------------------------------------------------
  // Initial Connection
  // -------------------------------------------------

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      wsRef.current?.close();

      wsRef.current = null;
    };
  }, [connect]);

  // -------------------------------------------------
  // Chaos Simulation: Force Disconnect
  // -------------------------------------------------

  useEffect(() => {
    if (
      config.forceDisconnect &&
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      console.warn('[WS] Forced disconnect triggered');

      wsRef.current.close();
    }
  }, [config.forceDisconnect]);

  // -------------------------------------------------
  // Send Function
  // -------------------------------------------------

  const send = useCallback((data: any) => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return {
    send,
  };
}