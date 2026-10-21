import { STATUS_LABEL } from '../lib/labels';

const TONE: Record<string, string> = {
  DRAFT: 'gray',
  CANCELLED: 'red',
  REJECTED: 'red',
  VOID: 'red',
  ABSENT: 'red',
  LATE: 'amber',
  PENDING: 'amber',
  UNPAID: 'amber',
  PARTIAL: 'amber',
  PARTIALLY_RECEIVED: 'amber',
  PARTIALLY_SHIPPED: 'amber',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${TONE[status] ?? 'green'}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <span className={`badge ${active ? '' : 'gray'}`}>{active ? '啟用' : '停用'}</span>;
}

export function OkBadge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return <span className={`badge ${ok ? '' : 'red'}`}>{ok ? yes : no}</span>;
}
