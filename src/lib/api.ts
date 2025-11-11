const DEFAULT_API_URL = "http://localhost:4000";

function getBaseUrl() {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof window !== "undefined") {
    return window.__APP_API_URL__ || DEFAULT_API_URL;
  }

  return DEFAULT_API_URL;
}

const API_BASE_URL = getBaseUrl().replace(/\/$/, "");

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  let data: T | { success: boolean; message?: string; details?: string } | null = null;
  try {
    data = (await response.json()) as T;
  } catch (error) {
    // Ignore JSON parse errors for empty responses
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "message" in data && data.message) ||
      `Erro na requisição (${response.status})`;
    throw new Error(typeof message === "string" ? message : "Erro na requisição");
  }

  return data as T;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
