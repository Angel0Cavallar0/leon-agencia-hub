import { logger } from "./logger.js";

export async function parseJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    const raw = Buffer.concat(chunks).toString("utf-8");
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    logger.error("Falha ao fazer parse do corpo JSON", { error: error.message });
    throw new Error("Corpo da requisição inválido");
  }
}

export function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export function setCors(res, allowedOrigins, origin) {
  const allowAll = allowedOrigins.includes("*");
  res.setHeader("Access-Control-Allow-Origin", allowAll ? "*" : origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", allowAll ? "false" : "true");
}
