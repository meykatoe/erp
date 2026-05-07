import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { useOptions } from '../hooks/useOptions';
import { usePaged } from '../hooks/usePaged';
import { date, money, qty } from '../lib/format';
import { STATUS_LABEL } from '../lib/labels';
import { OrderConfig } from './orders.config';

type Row = { id: string } & Record<string, any>;

export function OrderListPage({ cfg }: { cfg: OrderConfig }) {
  const { can } = useAuth();
  const nav = useNavigate();
  const [status, setStatus] = useState('');
  const { data, loading, page, setPage, search } = usePaged<Row>(cfg.base, { status: status || undefined });
  const statuses = cfg.route === '/purchase'
    ? ['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']
    : ['DRAFT', 'CONFIRMED', 'PARTIALLY_SHIPPED', 'SHIPPED', 'CANCELLED'];

  return (
    <section>
      <div className="page-head">
        <h2>{cfg.title}</h2>
        <div className="actions">
          <input className="search" placeholder="搜尋單號…" onChange={(e) => search(e.target.value)} />
          <select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))}>
            <option value="">全部狀態</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          {can(cfg.writePerm) && (
            <button className="primary" onClick={() => nav(`${cfg.route}/new`)}>
              新增{cfg.title}
            </button>
          )}
        </div>
      </div>
      <DataTable
        loading={loading}
        rows={data?.items ?? []}
        onRowClick={(r) => nav(`${cfg.route}/${r.id}`)}
        columns={[
          { key: 'no', label: '單號' },
          { key: 'party', label: cfg.partyLabel, render: (r) => r[cfg.partyKey]?.name },
          { key: 'wh', label: '倉庫', render: (r) => r.warehouse?.name },
          { key: 'orderDate', label: '日期', render: (r) => date(r.orderDate) },
          { key: 'total', label: '金額', align: 'right', render: (r) => money(r.total) },
          { key: 'status', label: '狀態', render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
      {data && <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
    </section>
  );
}
