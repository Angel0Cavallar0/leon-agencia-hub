import { randomUUID } from "crypto";
import {
  enviarMensagemTexto,
  enviarArquivo,
  enviarImagem,
  enviarMensagemComBotoes,
  enviarMensagemComLista,
  obterStatus,
  obterQRCode,
  reconectarSessao,
  desconectarSessao,
} from "../services/zapi/index.js";
import { logger } from "../utils/logger.js";
import { sendJson } from "../utils/http.js";
import {
  addMessage,
  getConversations,
  getConversationMessages,
  markConversationAsRead,
} from "../stores/conversationStore.js";
import { broadcastEvent } from "../events/sse.js";

function createOutgoingMessage(type, body, extras = {}) {
  return {
    id: randomUUID(),
    direction: "outgoing",
    type,
    content: extras.content ?? body.mensagem ?? "",
    timestamp: new Date().toISOString(),
    agentId: body.agentId ?? null,
    agentName: body.agentName ?? null,
    mediaUrl: extras.mediaUrl ?? null,
    caption: extras.caption ?? null,
    fileName: extras.fileName ?? null,
    buttons: extras.buttons ?? null,
    listItems: extras.listItems ?? null,
    metadata: extras.metadata ?? null,
  };
}

function handleSuccess(res, conversation, message, apiResponse) {
  broadcastEvent("message", {
    conversation,
    message,
  });
  sendJson(res, 200, {
    success: true,
    conversation,
    message,
    apiResponse,
  });
}

function handleControllerError(res, error, contextMessage) {
  logger.error(contextMessage, { error: error.message, status: error.status || 500 });
  sendJson(res, error.status || 500, {
    success: false,
    message: contextMessage,
    details: error.message,
  });
}

export async function getConversationListController(req, res) {
  const conversations = getConversations();
  sendJson(res, 200, { success: true, conversations });
}

export async function getConversationMessagesController(req, res, params) {
  const [numero] = params;
  const messages = getConversationMessages(numero);
  sendJson(res, 200, { success: true, messages });
}

export async function markConversationReadController(req, res, params) {
  const [numero] = params;
  const conversation = markConversationAsRead(numero);
  if (!conversation) {
    sendJson(res, 404, { success: false, message: "Conversa não encontrada" });
    return;
  }

  broadcastEvent("conversation", { conversation });
  sendJson(res, 200, { success: true, conversation });
}

export async function sendTextMessageController(req, res, _params, body) {
  if (!body?.numero || !body?.mensagem) {
    sendJson(res, 400, { success: false, message: "Número e mensagem são obrigatórios" });
    return;
  }

  try {
    const apiResponse = await enviarMensagemTexto(body.numero, body.mensagem);
    const message = createOutgoingMessage("text", body, { content: body.mensagem });
    const conversation = addMessage(body.numero, message, { displayName: body.displayName });
    logger.info("Mensagem de texto enviada", { numero: body.numero, agentId: body.agentId });
    handleSuccess(res, conversation, message, apiResponse);
  } catch (error) {
    handleControllerError(res, error, "Falha ao enviar mensagem de texto");
  }
}

export async function sendFileMessageController(req, res, _params, body) {
  if (!body?.numero || !body?.arquivoUrl) {
    sendJson(res, 400, { success: false, message: "Número e URL do arquivo são obrigatórios" });
    return;
  }

  try {
    const apiResponse = await enviarArquivo(body.numero, body.arquivoUrl, body.fileName);
    const message = createOutgoingMessage("file", body, {
      content: body.mensagem || "Arquivo enviado",
      mediaUrl: body.arquivoUrl,
      fileName: body.fileName || null,
    });
    const conversation = addMessage(body.numero, message, { displayName: body.displayName });
    logger.info("Arquivo enviado via Z-API", { numero: body.numero, agentId: body.agentId });
    handleSuccess(res, conversation, message, apiResponse);
  } catch (error) {
    handleControllerError(res, error, "Falha ao enviar arquivo");
  }
}

export async function sendImageMessageController(req, res, _params, body) {
  if (!body?.numero || !body?.imagemUrl) {
    sendJson(res, 400, { success: false, message: "Número e URL da imagem são obrigatórios" });
    return;
  }

  try {
    const apiResponse = await enviarImagem(body.numero, body.imagemUrl, body.caption);
    const message = createOutgoingMessage("image", body, {
      content: body.caption || "Imagem enviada",
      mediaUrl: body.imagemUrl,
      caption: body.caption || null,
    });
    const conversation = addMessage(body.numero, message, { displayName: body.displayName });
    logger.info("Imagem enviada via Z-API", { numero: body.numero, agentId: body.agentId });
    handleSuccess(res, conversation, message, apiResponse);
  } catch (error) {
    handleControllerError(res, error, "Falha ao enviar imagem");
  }
}

export async function sendButtonsMessageController(req, res, _params, body) {
  if (!body?.numero || !body?.titulo || !Array.isArray(body?.botoes)) {
    sendJson(res, 400, { success: false, message: "Número, título e botões são obrigatórios" });
    return;
  }

  try {
    const apiResponse = await enviarMensagemComBotoes(body.numero, body.titulo, body.botoes);
    const message = createOutgoingMessage("buttons", body, {
      content: body.titulo,
      buttons: body.botoes,
    });
    const conversation = addMessage(body.numero, message, { displayName: body.displayName });
    logger.info("Mensagem com botões enviada", { numero: body.numero, agentId: body.agentId });
    handleSuccess(res, conversation, message, apiResponse);
  } catch (error) {
    handleControllerError(res, error, "Falha ao enviar mensagem com botões");
  }
}

export async function sendListMessageController(req, res, _params, body) {
  if (!body?.numero || !Array.isArray(body?.listaDeItens)) {
    sendJson(res, 400, { success: false, message: "Número e itens da lista são obrigatórios" });
    return;
  }

  try {
    const apiResponse = await enviarMensagemComLista(body.numero, body.listaDeItens);
    const message = createOutgoingMessage("list", body, {
      content: body.titulo || "Lista enviada",
      listItems: body.listaDeItens,
    });
    const conversation = addMessage(body.numero, message, { displayName: body.displayName });
    logger.info("Mensagem com lista enviada", { numero: body.numero, agentId: body.agentId });
    handleSuccess(res, conversation, message, apiResponse);
  } catch (error) {
    handleControllerError(res, error, "Falha ao enviar mensagem com lista");
  }
}

export async function getStatusController(req, res) {
  try {
    const status = await obterStatus();
    broadcastEvent("status", status);
    sendJson(res, 200, { success: true, status });
  } catch (error) {
    handleControllerError(res, error, "Falha ao obter status");
  }
}

export async function getQrCodeController(req, res) {
  try {
    const qrCode = await obterQRCode();
    sendJson(res, 200, { success: true, qrCode });
  } catch (error) {
    handleControllerError(res, error, "Falha ao obter QR Code");
  }
}

export async function reconnectSessionController(req, res) {
  try {
    const response = await reconectarSessao();
    broadcastEvent("status", { action: "reconnect", response });
    sendJson(res, 200, { success: true, response });
  } catch (error) {
    handleControllerError(res, error, "Falha ao reconectar sessão");
  }
}

export async function disconnectSessionController(req, res) {
  try {
    const response = await desconectarSessao();
    broadcastEvent("status", { action: "disconnect", response });
    sendJson(res, 200, { success: true, response });
  } catch (error) {
    handleControllerError(res, error, "Falha ao desconectar sessão");
  }
}
