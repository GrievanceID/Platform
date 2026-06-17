/**
 * api/client.js — thin fetch wrapper.
 *
 * Token injection: the caller passes the token explicitly rather than reading
 * from a module-level variable, so the auth context owns the token and this
 * module stays stateless and testable.
 *
 * All requests go to the same origin (Vite proxy in dev, same host in prod).
 * No base URL hardcoded — the app is designed to run air-gapped on a local
 * network where the backend port may differ; configure via vite.config.js proxy.
 */

const API_BASE = '/api';

/**
 * @param {string} path       e.g. '/auth/login'
 * @param {object} options
 * @param {string} [options.method]   default GET
 * @param {object|FormData} [options.body]
 * @param {string} [options.token]    JWT to send as Bearer
 * @returns {Promise<{data: any, status: number}>}
 * @throws  {Error} with .message set to the server's error string
 */
export async function api_request(path, { method = 'GET', body, token } = {}) {
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const is_form_data = body instanceof FormData;

  if (body && !is_form_data) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body
      ? is_form_data
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  let data;
  const content_type = res.headers.get('content-type') ?? '';
  if (content_type.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      (typeof data === 'object' && data?.error) ||
      (typeof data === 'string' && data) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return { data, status: res.status };
}
