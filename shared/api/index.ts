export interface ApiOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined>;
}

export const buildQueryString = (query?: ApiOptions["query"]): string => {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export const getApiBaseUrl = (): string => {
  if (typeof process !== "undefined" && process.env.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL;
  }
  // @ts-ignore accessing Vite env in shared context
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    // @ts-ignore same as above
    return import.meta.env.VITE_API_BASE_URL as string;
  }
  return "http://localhost:3000/api";
};

export const apiFetch = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const queryString = buildQueryString(options.query);
  const response = await fetch(`${getApiBaseUrl()}${path}${queryString}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};
