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

  useEffect(() => {
    const es = new EventSource(url, { withCredentials });
    eventSourceRef.current = es;
    es.onmessage = (event) => {
      try {
        const sseData = JSON.parse(event.data);
        const data = sseData?.data;
        switch (data.type) {
          case "scan_chip": {
            const payload = data?.payload;
            onMessage(payload);
            break;
          }
          default: {
            break;
          }
        }
      } catch (e) {
        console.error("SSE parse error", e);
      }
    };

    es.onerror = (err) => {
      console.error("SSE error", err);
      onError?.(err);
      es.close();
    };

    return () => {
      es.close();
    };
  }, [url]);

  return {
    close: () => eventSourceRef.current?.close(),
  };
}
