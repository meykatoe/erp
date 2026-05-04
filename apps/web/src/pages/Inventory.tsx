import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { useOptions } from '../hooks/useOptions';
import { usePaged } from '../hooks/usePaged';
import { datetime, money, qty } from '../lib/format';
import { MOVEMENT_LABEL } from '../lib/labels';

type Row = { id: string } & Record<string, any>;

export function InventoryPage() {
  const { can } = useAuth();
  const toast = useToast();
  const { options: whs } = useOptions<Row>('/warehouses', (w) => `${w.code} ${w.name}`);
  const { options: prods } = useOptions<Row>('/products', (p) => `${p.sku} ${p.name}`);
  const [warehouseId, setWarehouseId] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const { data, loading, page, setPage, search, reload } = usePaged<Row>('/inventory/levels', {
    warehouseId: warehouseId || undefined,
    lowStock: lowOnly ? 'true' : undefined,
  });
  const [mode, setMode] = useState<'adjust' | 'transfer' | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'adjust') {
        await api('/inventory/adjust', {
          body: { productId: form.productId, warehouseId: form.warehouseId, countedQty: Number(form.qty), note: form.note || undefined },
        });
      } else {
        await api('/inventory/transfer', {
          body: {
            productId: form.productId,
            fromWarehouseId: form.warehouseId,
            toWarehouseId: form.toWarehouseId,
            quantity: Number(form.qty),
            note: form.note || undefined,
          },
        });
      }
      toast('ok', '已完成');
      setMode(null);
      reload();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  const sel = (name: string, label: string, options: { value: string; label: string }[]) => (
    <label>
      <span>{label}</span>
      <select required value={form[name] ?? ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })}>
        <option value="">請選擇</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <section>
      <div className="page-head">
        <h2>庫存查詢</h2>
        <div className="actions">
          <input className="search" placeholder="搜尋料號或品名…" onChange={(e) => search(e.target.value)} />
          <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
            <option value="">全部倉庫</option>
            {whs.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
          <label className="actions">
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            僅低庫存
          </label>
          {can('inventory:adjust') && (
            <>
              <button onClick={() => (setForm({}), setMode('adjust'))}>盤點調整</button>
              <button onClick={() => (setForm({}), setMode('transfer'))}>調撥</button>
            </>
          )}
        </div>
      </div>
      <DataTable
        loading={loading}
        rows={data?.items ?? []}
        columns={[
          { key: 'sku', label: '料號', render: (r) => r.product.sku },
          { key: 'name', label: '品名', render: (r) => r.product.name },
          { key: 'wh', label: '倉庫', render: (r) => r.warehouse.name },
          {
            key: 'quantity',
            label: '數量',
            align: 'right',
            render: (r) => <span style={r.low ? { color: 'var(--danger)', fontWeight: 600 } : undefined}>{qty(r.quantity)}</span>,
          },
          { key: 'reorder', label: '安全庫存', align: 'right', render: (r) => qty(r.product.reorderPoint) },
          { key: 'cost', label: '單位成本', align: 'right', render: (r) => money(r.product.cost) },
          { key: 'value', label: '庫存金額', align: 'right', render: (r) => money(r.value) },
        ]}
      />
      {data && <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
      {mode && (
        <Modal title={mode === 'adjust' ? '盤點調整' : '庫存調撥'} onClose={() => setMode(null)}>
          <form className="form" onSubmit={submit}>
            {sel('productId', '商品', prods)}
            {sel('warehouseId', mode === 'adjust' ? '倉庫' : '來源倉庫', whs)}
            {mode === 'transfer' && sel('toWarehouseId', '目的倉庫', whs)}
            <label>
              <span>{mode === 'adjust' ? '盤點實際數量' : '調撥數量'}</span>
              <input type="number" step="any" min="0" required value={form.qty ?? ''} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
            </label>
            <label>
              <span>備註</span>
              <input value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
            <footer>
              <button className="primary">送出</button>
            </footer>
          </form>
        </Modal>
      )}
    </section>
  );
}
