const TOKEN_KEY = 'erp_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface Options {
  method?: string;
  body?: unknown;
  query?: Query;
}

export function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  return `/api${path}${qs ? `?${qs}` : ''}`;
}

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: {
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && token) {
    tokenStore.clear();
    window.dispatchEvent(new Event('erp:unauthorized'));
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join('、') : data?.message;
    throw new ApiError(res.status, msg ?? `請求失敗 (${res.status})`);
  }
  return data as T;
}
