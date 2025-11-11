import { getZapiConfig } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const { baseUrl } = getZapiConfig();

async function request(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const { method = "GET", body } = options;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    logger.warning("Resposta Z-API sem JSON", { endpoint, status: response.status });
  }

  if (!response.ok) {
    const errorMessage = data?.message || `Falha ao comunicar com Z-API (${response.status})`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const zapiClient = {
  get(endpoint) {
    return request(endpoint, { method: "GET" });
  },
  post(endpoint, body) {
    return request(endpoint, { method: "POST", body });
  },
};
