import http from "http";
import { getServerConfig, validateEnv } from "./config/env.js";
import { zapiRouter } from "./routes/zapiRoutes.js";
import { handleZapiWebhook } from "./webhooks/zapiWebhook.js";
import { logger } from "./utils/logger.js";
import { setCors, sendJson } from "./utils/http.js";

validateEnv();

const { port, allowedOrigins } = getServerConfig();

const server = http.createServer(async (req, res) => {
  try {
    const origin = req.headers.origin || "";
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/webhook/zapi") {
      await handleZapiWebhook(req, res);
      return;
    }

    if (url.pathname.startsWith("/api/zapi")) {
      const handled = await zapiRouter.handle(req, res);
      if (handled) {
        return;
      }
    }

    setCors(res, allowedOrigins, origin);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (url.pathname === "/health") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    sendJson(res, 404, { success: false, message: "Rota não encontrada" });
  } catch (error) {
    logger.error("Erro inesperado no servidor", { error: error.message });
    try {
      sendJson(res, 500, { success: false, message: "Erro interno do servidor" });
    } catch (sendError) {
      logger.error("Falha ao enviar resposta de erro", { error: sendError.message });
    }
  }
});

server.listen(port, () => {
  logger.info("Servidor Z-API iniciado", { port });
});
