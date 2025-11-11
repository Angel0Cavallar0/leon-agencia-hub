import { randomUUID } from "crypto";
import { parseJsonBody, sendJson, setCors } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import { addMessage, upsertConversationDisplayName } from "../stores/conversationStore.js";
import { broadcastEvent } from "../events/sse.js";
import { getServerConfig } from "../config/env.js";

export async function handleZapiWebhook(req, res) {
  const { allowedOrigins } = getServerConfig();
  setCors(res, allowedOrigins, req.headers.origin || "");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, { success: true });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { success: false, message: "Método não permitido" });
    return;
  }

  let body;
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    logger.error("Webhook inválido", { error: error.message });
    sendJson(res, 400, { success: false, message: "Payload inválido" });
    return;
  }

  const numero =
    body?.phone ||
    body?.from ||
    body?.remoteJid ||
    body?.number ||
    body?.chatId ||
    body?.contact ||
    "desconhecido";

  const timestamp = body?.timestamp
    ? new Date(Number(body.timestamp) * (String(body.timestamp).length === 10 ? 1000 : 1)).toISOString()
    : new Date().toISOString();

  const type = body?.type || (body?.imageUrl ? "image" : body?.fileUrl ? "file" : "text");
  const mediaUrl = body?.imageUrl || body?.fileUrl || body?.mediaUrl || null;
  const caption = body?.caption || body?.message?.caption || null;
  let content =
    body?.message?.text ||
    body?.message?.body ||
    body?.body ||
    body?.text ||
    caption ||
    "";

  if (content && typeof content !== "string") {
    content = JSON.stringify(content);
  }

  const displayName = body?.senderName || body?.contactName || body?.pushName || null;
  if (displayName) {
    upsertConversationDisplayName(numero, displayName);
  }

  const message = {
    id: body?.messageId || body?.id || randomUUID(),
    direction: "incoming",
    type,
    content,
    timestamp,
    agentId: null,
    agentName: displayName,
    mediaUrl,
    caption,
    fileName: body?.fileName || null,
    buttons: null,
    listItems: null,
    metadata: { webhook: body },
  };

  const conversation = addMessage(numero, message, { displayName: displayName || numero });
  logger.info("Mensagem recebida via webhook", { numero, type });
  broadcastEvent("message", { conversation, message });

  sendJson(res, 200, { success: true });
}
