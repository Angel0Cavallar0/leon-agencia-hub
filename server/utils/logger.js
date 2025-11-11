import { randomUUID } from "crypto";

const MAX_LOGS = 500;
const logs = [];

function addLog(level, message, context) {
  const entry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context ?? null,
  };

  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  const payload = context ? `${message} | ${JSON.stringify(context)}` : message;
  console.log(`[${level}] ${payload}`);

  return entry;
}

export const logger = {
  info(message, context) {
    return addLog("INFO", message, context);
  },
  warning(message, context) {
    return addLog("WARNING", message, context);
  },
  error(message, context) {
    return addLog("ERROR", message, context);
  },
  getLogs() {
    return [...logs];
  },
};
