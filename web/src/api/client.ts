import { storage } from '@/utils/storage';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';

type HttpMethod = 'GET' | 'POST';

interface RequestOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

async function request<TResponse, TBody = unknown>(path: string, options: RequestOptions<TBody> = {}) {
  const url = `${API_BASE}${path}`;
  const token = storage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {})
  };

  if (!options.skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (response.status === 401) {
    storage.clearAuth();
    throw new Error('未授权，请重新注册匿名身份。');
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : undefined;

  if (!response.ok) {
    const message = (payload && (payload.message as string | undefined)) ?? '请求失败';
    throw new Error(message);
  }

  return payload as TResponse;
}

export const apiClient = {
  get: <TResponse>(path: string, options?: RequestOptions<never>) =>
    request<TResponse>(path, { ...options, method: 'GET' }),
  post: <TResponse, TBody = unknown>(path: string, body?: TBody, options?: RequestOptions<TBody>) =>
    request<TResponse, TBody>(path, { ...options, method: 'POST', body })
};
