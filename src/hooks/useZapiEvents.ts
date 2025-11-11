import { useEffect, useRef } from "react";
import { getApiBaseUrl } from "@/lib/api";

export interface ZapiEventHandlers<TMessage = unknown, TStatus = unknown> {
  onMessage?: (payload: TMessage) => void;
  onConversation?: (payload: unknown) => void;
  onStatus?: (payload: TStatus) => void;
  onError?: (error: Event) => void;
}

export interface UseZapiEventsOptions {
  enabled?: boolean;
}

export function useZapiEvents<TMessage = unknown, TStatus = unknown>(
  handlers: ZapiEventHandlers<TMessage, TStatus>,
  options: UseZapiEventsOptions = {}
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (options.enabled === false) {
      return undefined;
    }

    const baseUrl = getApiBaseUrl();
    const eventSource = new EventSource(`${baseUrl}/api/zapi/events`);

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as TMessage;
        handlersRef.current.onMessage?.(data);
      } catch (error) {
        console.error("Erro ao processar evento de mensagem", error);
      }
    };

    const handleConversation = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        handlersRef.current.onConversation?.(data);
      } catch (error) {
        console.error("Erro ao processar evento de conversa", error);
      }
    };

    const handleStatus = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as TStatus;
        handlersRef.current.onStatus?.(data);
      } catch (error) {
        console.error("Erro ao processar evento de status", error);
      }
    };

    eventSource.addEventListener("message", handleMessage);
    eventSource.addEventListener("conversation", handleConversation);
    eventSource.addEventListener("status", handleStatus);

    eventSource.onerror = (event) => {
      handlersRef.current.onError?.(event);
    };

    return () => {
      eventSource.removeEventListener("message", handleMessage);
      eventSource.removeEventListener("conversation", handleConversation);
      eventSource.removeEventListener("status", handleStatus);
      eventSource.close();
    };
  }, [options.enabled]);
}
