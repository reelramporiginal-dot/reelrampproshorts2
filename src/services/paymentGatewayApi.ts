// src/services/paymentGatewayApi.ts
const API_BASE = (import.meta as any).env?.VITE_GATEWAY_API || 'http://localhost:4000';

export async function verifyGatewayAPI(provider: string, payload: any) {
  const r = await fetch(`${API_BASE}/api/admin/gateways/${provider}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function saveGatewayAPI(provider: string, payload: any) {
  const r = await fetch(`${API_BASE}/api/admin/gateways/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json();
}
