import { apiFetch } from "@/lib/api";

export interface ConversationSummary {
  id: string;
  contactNumber: string;
  displayName: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  lastAgentName: string | null;
}

export interface ChatMessage {
  id: string;
  direction: "incoming" | "outgoing";
  type: "text" | "image" | "file" | "buttons" | "list";
  content: string;
  timestamp: string;
  agentId: string | null;
  agentName: string | null;
  mediaUrl?: string | null;
  caption?: string | null;
  fileName?: string | null;
  buttons?: string[] | null;
  listItems?: Array<Record<string, unknown>> | null;
  metadata?: Record<string, unknown> | null;
}

export interface SessionStatus {
  connected?: boolean;
  state?: string;
  batteryLevel?: number;
  phone?: string;
  action?: string;
  response?: unknown;
  [key: string]: unknown;
}

export interface QrCodeResponse {
  qrCode?: string;
  image?: string;
  base64?: string;
  [key: string]: unknown;
}

export interface SendTextPayload {
  numero: string;
  mensagem: string;
  agentId: string;
  agentName: string;
  displayName?: string;
}

export interface SendFilePayload extends Omit<SendTextPayload, "mensagem"> {
  arquivoUrl: string;
  mensagem?: string;
  fileName?: string;
}

export interface SendImagePayload extends Omit<SendTextPayload, "mensagem"> {
  imagemUrl: string;
  caption?: string;
}

export interface SendButtonsPayload extends Omit<SendTextPayload, "mensagem"> {
  titulo: string;
  botoes: string[];
}

export interface SendListPayload extends Omit<SendTextPayload, "mensagem"> {
  titulo?: string;
  listaDeItens: Array<Record<string, unknown>>;
}

export async function fetchConversations() {
  return apiFetch<{ success: boolean; conversations: ConversationSummary[] }>(
    "/api/zapi/conversations"
  );
}

export async function fetchConversationMessages(numero: string) {
  return apiFetch<{ success: boolean; messages: ChatMessage[] }>(
    `/api/zapi/conversations/${encodeURIComponent(numero)}/messages`
  );
}

export async function markConversationAsRead(numero: string) {
  return apiFetch<{ success: boolean }>(
    `/api/zapi/conversations/${encodeURIComponent(numero)}/read`,
    {
      method: "POST",
    }
  );
}

export async function sendTextMessage(payload: SendTextPayload) {
  return apiFetch<{ success: boolean; conversation: ConversationSummary; message: ChatMessage }>("/api/zapi/messages/text", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendFileMessage(payload: SendFilePayload) {
  return apiFetch<{ success: boolean; conversation: ConversationSummary; message: ChatMessage }>("/api/zapi/messages/file", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendImageMessage(payload: SendImagePayload) {
  return apiFetch<{ success: boolean; conversation: ConversationSummary; message: ChatMessage }>("/api/zapi/messages/image", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendButtonsMessage(payload: SendButtonsPayload) {
  return apiFetch<{ success: boolean; conversation: ConversationSummary; message: ChatMessage }>("/api/zapi/messages/buttons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendListMessage(payload: SendListPayload) {
  return apiFetch<{ success: boolean; conversation: ConversationSummary; message: ChatMessage }>("/api/zapi/messages/list", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchStatus() {
  return apiFetch<{ success: boolean; status: SessionStatus }>("/api/zapi/status");
}

export async function fetchQrCode() {
  return apiFetch<{ success: boolean; qrCode: QrCodeResponse }>("/api/zapi/qrcode");
}

export async function reconnectSession() {
  return apiFetch<{ success: boolean }>("/api/zapi/session/reconnect", {
    method: "POST",
  });
}

export async function disconnectSession() {
  return apiFetch<{ success: boolean }>("/api/zapi/session/disconnect", {
    method: "POST",
  });
}
