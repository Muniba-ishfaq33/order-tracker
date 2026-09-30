import { API_URL } from './config';

const headers = { 'Content-Type': 'application/json' };

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { headers, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ---- REST ----
export const getCatalog = () => request('/api/v1/catalog');
export const getOrders = (customer) =>
  request(`/api/v1/orders${customer ? `?customer=${encodeURIComponent(customer)}` : ''}`);
export const createOrder = (body) =>
  request('/api/v1/orders', { method: 'POST', body: JSON.stringify(body) });
export const updateStatus = (id, status) =>
  request(`/api/v1/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const sendAlert = (message, level) =>
  request('/api/v1/alerts', { method: 'POST', body: JSON.stringify({ message, level }) });

// ---- JSON-RPC 2.0 ----
export async function rpc(method, params) {
  const res = await fetch(`${API_URL}/rpc`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}