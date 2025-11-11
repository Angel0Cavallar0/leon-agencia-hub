import { randomUUID } from "crypto";
import { logger } from "../utils/logger.js";
import { setCors } from "../utils/http.js";
import { getServerConfig } from "../config/env.js";

const clients = new Map();

export function sseHandler(req, res) {
  const { allowedOrigins } = getServerConfig();
  setCors(res, allowedOrigins, req.headers.origin || "");

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write(`event: init\ndata: ${JSON.stringify({ success: true })}\n\n`);

  const clientId = randomUUID();
  clients.set(clientId, res);
  logger.info("Cliente SSE conectado", { clientId, totalClients: clients.size });

  req.on("close", () => {
    clients.delete(clientId);
    logger.info("Cliente SSE desconectado", { clientId, totalClients: clients.size });
  });
}

export function broadcastEvent(event, payload) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const [, clientRes] of clients) {
    try {
      clientRes.write(message);
    } catch (error) {
      logger.error("Erro ao enviar evento SSE", { error: error.message });
    }
  }
}
