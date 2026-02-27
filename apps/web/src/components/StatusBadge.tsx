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
