// hooks/useSse.ts
import { useEffect, useRef } from "react";

interface UseSseOptions {
  url: string;
  onMessage: (data: any) => void;
  onError?: (error: Event) => void;
  withCredentials?: boolean;
}

export function useSse({
  url,
  onMessage,
  onError,
  withCredentials = false,
}: UseSseOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      if (!url || !mountedRef.current) return;

      const es = new EventSource(url, { withCredentials });
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const sseData = JSON.parse(event.data);
          if (sseData.type === "scan_chip") {
            onMessage(sseData?.payload);
          }
        } catch (e) {
          console.error("SSE parse error", e);
        }
      };

      es.onerror = (err) => {
        console.error("SSE error", err);
        onError?.(err);
        es.close();
        if (mountedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      eventSourceRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return {
    close: () => eventSourceRef.current?.close(),
  };
}
