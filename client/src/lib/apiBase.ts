/**
 * Browser API base for fetch() calls that cannot use the axios instance.
 * Defaults to `/api` so Vite proxy and production nginx same-origin both work.
 */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_URL;
  if (raw !== undefined && raw !== '') {
    return String(raw).replace(/\/$/, '');
  }
  return '/api';
}
