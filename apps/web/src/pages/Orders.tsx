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

interface FormItem {
  productId: string;
  quantity: string;
  unitPrice: string;
}

export function OrderFormPage({ cfg }: { cfg: OrderConfig }) {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { options: parties } = useOptions<Row>(cfg.partyEndpoint, (p) => `${p.code} ${p.name}`);
  const { options: whs } = useOptions<Row>('/warehouses', (w) => `${w.code} ${w.name}`);
  const { options: prods, rows: products } = useOptions<Row>('/products', (p) => `${p.sku} ${p.name}`);
  const [partyId, setPartyId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<FormItem[]>([{ productId: '', quantity: '1', unitPrice: '' }]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<Row>(`${cfg.base}/${id}`).then((o) => {
      setPartyId(o[cfg.partyIdKey]);
      setWarehouseId(o.warehouseId ?? o.warehouse.id);
      setExpectedDate(o.expectedDate?.slice(0, 10) ?? '');
      setNote(o.note ?? '');
      setItems(o.items.map((i: Row) => ({ productId: i.productId, quantity: String(i.quantity), unitPrice: String(i.unitPrice) })));
    });
  }, [id, cfg]);

  const setItem = (i: number, patch: Partial<FormItem>) =>
    setItems((s) => s.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const pickProduct = (i: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    setItem(i, { productId, unitPrice: p ? String(Number(p[cfg.priceKey])) : '' });
  };

  const total = items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        [cfg.partyIdKey]: partyId,
        warehouseId,
        expectedDate: expectedDate || undefined,
        note: note || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      };
      const res = id
        ? await api<Row>(`${cfg.base}/${id}`, { method: 'PUT', body })
        : await api<Row>(cfg.base, { body });
      toast('ok', '已儲存');
      nav(`${cfg.route}/${res.id}`);
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h2>
          {id ? '編輯' : '新增'}
          {cfg.title}
        </h2>
      </div>
      <form className="form card" onSubmit={submit}>
        <div className="split">
          <label>
            <span>{cfg.partyLabel} *</span>
            <select required value={partyId} onChange={(e) => setPartyId(e.target.value)}>
              <option value="">請選擇</option>
              {parties.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>倉庫 *</span>
            <select required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              <option value="">請選擇</option>
              {whs.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>預計日期</span>
            <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
          </label>
          <label>
            <span>備註</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
        <div className="table-wrap items-edit">
          <table>
            <thead>
              <tr>
                <th>商品</th>
                <th className="num">數量</th>
                <th className="num">單價</th>
                <th className="num">小計</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>
                    <select required value={it.productId} onChange={(e) => pickProduct(i, e.target.value)}>
                      <option value="">請選擇</option>
                      {prods.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input type="number" min="0.001" step="any" required value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} />
                  </td>
                  <td>
                    <input type="number" min="0" step="any" required value={it.unitPrice} onChange={(e) => setItem(i, { unitPrice: e.target.value })} />
                  </td>
                  <td className="num">{money(Number(it.quantity || 0) * Number(it.unitPrice || 0))}</td>
                  <td>
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems((s) => s.filter((_, idx) => idx !== i))}>
                        移除
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <button type="button" onClick={() => setItems((s) => [...s, { productId: '', quantity: '1', unitPrice: '' }])}>
            新增明細
          </button>
        </div>
        <div className="total">合計 {money(total)}</div>
        <footer>
          <button type="button" onClick={() => nav(cfg.route)}>
            取消
          </button>
          <button className="primary" disabled={busy}>
            儲存
          </button>
        </footer>
      </form>
    </section>
  );
}
