export function money(v: string | number | null | undefined) {
  const n = Number(v ?? 0);
  return n.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function qty(v: string | number | null | undefined) {
  return Number(v ?? 0).toLocaleString('zh-TW', { maximumFractionDigits: 3 });
}

export function date(v: string | Date | null | undefined) {
  if (!v) return '';
  return new Date(v).toLocaleDateString('zh-TW');
}

export function datetime(v: string | Date | null | undefined) {
  if (!v) return '';
  return new Date(v).toLocaleString('zh-TW', { hour12: false });
}

export const today = () => new Date().toISOString().slice(0, 10);
