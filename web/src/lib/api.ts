// Same-origin API client: nginx proxies /api/ -> backend:3000 in every deployed
// environment; vite dev-server proxies it locally. Never hardcode a backend host.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? `${status}`);
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  if (res.status === 401) {
    // Session expired / unauthenticated — clear and bounce to login.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!location.pathname.startsWith('/login')) {
      location.assign('/login');
    }
    throw new ApiError(401, 'Unauthorized');
  }
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise<T>;
}
