import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "../../");
const envFilePath = path.join(projectRoot, ".env");

function loadEnvFile() {
  if (!fs.existsSync(envFilePath)) {
    return;
  }

  const lines = fs.readFileSync(envFilePath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const [key, ...rest] = line.split("=");
    if (!key) continue;
    const value = rest.join("=").trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

if (!process.env.ZAPI_INSTANCE_ID) {
  process.env.ZAPI_INSTANCE_ID = "3E60DC6C713210142DA46EB3E4757B57";
}

if (!process.env.ZAPI_TOKEN) {
  process.env.ZAPI_TOKEN = "967C174309489036EF7F86C7";
}

if (!process.env.ZAPI_BASE_URL) {
  process.env.ZAPI_BASE_URL = "https://api.z-api.io/instances/3E60DC6C713210142DA46EB3E4757B57/token/967C174309489036EF7F86C7";
}

const REQUIRED_ENV = ["ZAPI_INSTANCE_ID", "ZAPI_TOKEN", "ZAPI_BASE_URL"];

export function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente ausentes: ${missing.join(", ")}. Configure-as antes de iniciar o servidor.`
    );
  }
}

export function getZapiConfig() {
  validateEnv();
  const baseUrl = process.env.ZAPI_BASE_URL.replace(/\/$/, "");
  return {
    instanceId: process.env.ZAPI_INSTANCE_ID,
    token: process.env.ZAPI_TOKEN,
    baseUrl,
  };
}

export function getServerConfig() {
  return {
    port: Number(process.env.PORT || 4000),
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean)
      : ["*"],
  };
}
