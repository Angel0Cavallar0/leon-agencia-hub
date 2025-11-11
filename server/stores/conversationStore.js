import { randomUUID } from "crypto";

const conversations = new Map();

function normalizeNumber(numero) {
  if (!numero) return "";
  return numero.toString().replace(/\D/g, "");
}

function getPreview(message) {
  switch (message.type) {
    case "image":
      return message.caption ? `Imagem: ${message.caption}` : "Imagem enviada";
    case "file":
      return message.fileName ? `Arquivo: ${message.fileName}` : "Arquivo enviado";
    case "buttons":
      return message.content || "Mensagem com botões";
    case "list":
      return message.content || "Mensagem com lista";
    default:
      return message.content || "Mensagem";
  }
}

function ensureConversation(contactNumber, metadata = {}) {
  const normalizedNumber = normalizeNumber(contactNumber);
  if (!conversations.has(normalizedNumber)) {
    conversations.set(normalizedNumber, {
      id: randomUUID(),
      contactNumber: normalizedNumber,
      displayName: metadata.displayName || normalizedNumber,
      lastMessagePreview: null,
      lastMessageAt: null,
      unreadCount: 0,
      lastAgentName: null,
      messages: [],
    });
  }
  return conversations.get(normalizedNumber);
}

export function addMessage(contactNumber, message, metadata = {}) {
  const conversation = ensureConversation(contactNumber, metadata);
  conversation.messages.push(message);
  conversation.lastMessagePreview = getPreview(message);
  conversation.lastMessageAt = message.timestamp;
  if (message.direction === "incoming") {
    conversation.unreadCount += 1;
  } else if (message.direction === "outgoing" && message.agentName) {
    conversation.lastAgentName = message.agentName;
  }
  return conversation;
}

export function getConversations() {
  return Array.from(conversations.values())
    .map((conversation) => ({
      id: conversation.id,
      contactNumber: conversation.contactNumber,
      displayName: conversation.displayName,
      lastMessagePreview: conversation.lastMessagePreview,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: conversation.unreadCount,
      lastAgentName: conversation.lastAgentName,
    }))
    .sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
}

export function getConversationMessages(contactNumber) {
  const normalizedNumber = normalizeNumber(contactNumber);
  const conversation = conversations.get(normalizedNumber);
  return conversation ? conversation.messages : [];
}

export function markConversationAsRead(contactNumber) {
  const normalizedNumber = normalizeNumber(contactNumber);
  const conversation = conversations.get(normalizedNumber);
  if (conversation) {
    conversation.unreadCount = 0;
  }
  return conversation;
}

export function upsertConversationDisplayName(contactNumber, displayName) {
  const conversation = ensureConversation(contactNumber, { displayName });
  conversation.displayName = displayName;
  return conversation;
}
