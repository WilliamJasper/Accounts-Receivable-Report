const API_BASE = import.meta.env.VITE_API_URL || '';

export async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || res.statusText);
  return data;
}

/** โหลด Claim Report — ส่ง startDate, endDate (YYYY-MM-DD) เพื่อกรองช่วง (ไม่ส่ง = ใช้ช่วง default ฝั่ง backend) */
export async function getClaimReport(params = {}) {
  const q = new URLSearchParams();
  if (params.startDate) q.set('startDate', params.startDate);
  if (params.endDate) q.set('endDate', params.endDate);
  const query = q.toString();
  return api(`/api/check-status/claim-report${query ? `?${query}` : ''}`);
}

export async function getOfficerList() {
  return api('/api/check-status/officer');
}

export async function getTables() {
  return api('/api/tables');
}

export async function getTableData(schema, table, params = {}) {
  const q = new URLSearchParams(params).toString();
  return api(`/api/table/${schema}/${table}${q ? `?${q}` : ''}`);
}
