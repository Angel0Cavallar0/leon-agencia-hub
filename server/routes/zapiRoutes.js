import { parseJsonBody, sendJson, setCors } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import { getServerConfig } from "../config/env.js";
import {
  getConversationListController,
  getConversationMessagesController,
  markConversationReadController,
  sendTextMessageController,
  sendFileMessageController,
  sendImageMessageController,
  sendButtonsMessageController,
  sendListMessageController,
  getStatusController,
  getQrCodeController,
  reconnectSessionController,
  disconnectSessionController,
} from "../controllers/zapiController.js";
import { sseHandler } from "../events/sse.js";

const routes = [
  { method: "GET", pattern: /^\/api\/zapi\/conversations$/, handler: getConversationListController },
  { method: "GET", pattern: /^\/api\/zapi\/conversations\/([^/]+)\/messages$/, handler: getConversationMessagesController },
  { method: "POST", pattern: /^\/api\/zapi\/conversations\/([^/]+)\/read$/, handler: markConversationReadController },
  { method: "POST", pattern: /^\/api\/zapi\/messages\/text$/, handler: sendTextMessageController },
  { method: "POST", pattern: /^\/api\/zapi\/messages\/file$/, handler: sendFileMessageController },
  { method: "POST", pattern: /^\/api\/zapi\/messages\/image$/, handler: sendImageMessageController },
  { method: "POST", pattern: /^\/api\/zapi\/messages\/buttons$/, handler: sendButtonsMessageController },
  { method: "POST", pattern: /^\/api\/zapi\/messages\/list$/, handler: sendListMessageController },
  { method: "GET", pattern: /^\/api\/zapi\/status$/, handler: getStatusController },
  { method: "GET", pattern: /^\/api\/zapi\/qrcode$/, handler: getQrCodeController },
  { method: "POST", pattern: /^\/api\/zapi\/session\/reconnect$/, handler: reconnectSessionController },
  { method: "POST", pattern: /^\/api\/zapi\/session\/disconnect$/, handler: disconnectSessionController },
  { method: "GET", pattern: /^\/api\/zapi\/events$/, handler: sseHandler, raw: true },
];

export const zapiRouter = {
  async handle(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const { allowedOrigins } = getServerConfig();
    setCors(res, allowedOrigins, req.headers.origin || "");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return true;
    }

    for (const route of routes) {
      if (req.method !== route.method) {
        continue;
      }

      const match = url.pathname.match(route.pattern);
      if (!match) {
        continue;
      }

      const params = match.slice(1);

      try {
        if (route.raw) {
          await route.handler(req, res, params);
          return true;
        }

        const body = ["POST", "PUT", "PATCH"].includes(req.method)
          ? await parseJsonBody(req)
          : undefined;

        await route.handler(req, res, params, body);
        return true;
      } catch (error) {
        logger.error("Erro ao processar rota", {
          path: url.pathname,
          method: req.method,
          error: error.message,
        });
        sendJson(res, 500, { success: false, message: "Erro interno do servidor" });
        return true;
      }
    }

    return false;
  },
};
