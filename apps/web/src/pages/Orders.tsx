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

export function OrderDetailPage({ cfg }: { cfg: OrderConfig }) {
  const { id } = useParams();
  const nav = useNavigate();
  const { can } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState<Row | null>(null);
  const [fulfilling, setFulfilling] = useState(false);
  const [qtys, setQtys] = useState<Record<string, string>>({});

  const load = () => api<Row>(`${cfg.base}/${id}`).then(setOrder);
  useEffect(() => {
    load().catch((e) => toast('error', e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!order) return <p className="muted">載入中…</p>;

  const act = async (action: string, body?: unknown) => {
    try {
      await api(`${cfg.base}/${id}/${action}`, { body: body ?? {} });
      toast('ok', '操作成功');
      await load();
      setFulfilling(false);
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  const openFulfill = () => {
    const init: Record<string, string> = {};
    for (const i of order.items) init[i.id] = String(Number(i.quantity) - Number(i[cfg.doneKey]));
    setQtys(init);
    setFulfilling(true);
  };

  const submitFulfill = (e: FormEvent) => {
    e.preventDefault();
    const items = Object.entries(qtys)
      .filter(([, v]) => Number(v) > 0)
      .map(([itemId, v]) => ({ itemId, quantity: Number(v) }));
    if (items.length === 0) return toast('error', '請輸入數量');
    act(cfg.fulfillAction, { items });
  };

  const st = order.status as string;
  const canFulfill = ['APPROVED', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'PARTIALLY_SHIPPED'].includes(st);

  return (
    <section>
      <div className="page-head">
        <h2>
          {cfg.title} {order.no} <StatusBadge status={st} />
        </h2>
        <div className="actions">
          <button onClick={() => nav(cfg.route)}>返回列表</button>
          {st === 'DRAFT' && can(cfg.writePerm) && <button onClick={() => nav(`${cfg.route}/${id}/edit`)}>編輯</button>}
          {st === 'DRAFT' && can(cfg.approvePerm) && (
            <button className="primary" onClick={() => act(cfg.approveAction)}>
              {cfg.approveLabel}
            </button>
          )}
          {canFulfill && can(cfg.fulfillPerm) && (
            <button className="primary" onClick={openFulfill}>
              {cfg.fulfillLabel}
            </button>
          )}
          {['DRAFT', 'APPROVED', 'CONFIRMED'].includes(st) && can(cfg.writePerm) && (
            <button
              className="danger"
              onClick={() => confirm('確定取消此單據?') && act('cancel')}
            >
              取消
            </button>
          )}
        </div>
      </div>
      <dl className="detail-head card">
        <div>
          <dt>{cfg.partyLabel}</dt>
          <dd>{order[cfg.partyKey]?.name}</dd>
        </div>
        <div>
          <dt>倉庫</dt>
          <dd>{order.warehouse?.name}</dd>
        </div>
        <div>
          <dt>單據日期</dt>
          <dd>{date(order.orderDate)}</dd>
        </div>
        <div>
          <dt>預計日期</dt>
          <dd>{date(order.expectedDate) || '-'}</dd>
        </div>
        <div>
          <dt>備註</dt>
          <dd>{order.note || '-'}</dd>
        </div>
      </dl>
      <DataTable
        rows={order.items}
        columns={[
          { key: 'sku', label: '料號', render: (r) => r.product.sku },
          { key: 'name', label: '品名', render: (r) => r.product.name },
          { key: 'quantity', label: '數量', align: 'right', render: (r) => qty(r.quantity) },
          { key: 'done', label: cfg.doneLabel, align: 'right', render: (r) => qty(r[cfg.doneKey]) },
          { key: 'unitPrice', label: '單價', align: 'right', render: (r) => money(r.unitPrice) },
          { key: 'amount', label: '金額', align: 'right', render: (r) => money(r.amount) },
        ]}
      />
      <div className="total">合計 {money(order.total)}</div>
      {fulfilling && (
        <Modal title={`${cfg.fulfillLabel} ${order.no}`} onClose={() => setFulfilling(false)}>
          <form className="form" onSubmit={submitFulfill}>
            {order.items.map((i: Row) => (
              <label key={i.id}>
                <span>
                  {i.product.sku} {i.product.name}(未完成 {qty(Number(i.quantity) - Number(i[cfg.doneKey]))})
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={qtys[i.id] ?? ''}
                  onChange={(e) => setQtys({ ...qtys, [i.id]: e.target.value })}
                />
              </label>
            ))}
            <footer>
              <button className="primary">確認{cfg.fulfillLabel}</button>
            </footer>
          </form>
        </Modal>
      )}
    </section>
  );
}
