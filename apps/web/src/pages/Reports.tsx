import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DataTable } from '../components/DataTable';
import { money, qty } from '../lib/format';

type Row = Record<string, any>;

export function ReportsPage() {
  const [top, setTop] = useState<Row[]>([]);
  const [val, setVal] = useState<Row | null>(null);
  const [income, setIncome] = useState<Row | null>(null);

  useEffect(() => {
    api<Row[]>('/reports/top-products').then(setTop).catch(() => {});
    api<Row>('/reports/inventory-valuation').then(setVal).catch(() => {});
    api<Row>('/reports/income-statement').then(setIncome).catch(() => {});
  }, []);

  return (
    <section>
      <div className="page-head">
        <h2>營運報表</h2>
      </div>
      <div className="split">
        <div className="panel">
          <h3>熱銷商品 Top 10</h3>
          <DataTable
            rows={top}
            columns={[
              { key: 'sku', label: '料號' },
              { key: 'name', label: '品名' },
              { key: 'quantity', label: '數量', align: 'right', render: (r) => qty(r.quantity) },
              { key: 'amount', label: '金額', align: 'right', render: (r) => money(r.amount) },
            ]}
          />
        </div>
        <div className="panel">
          <h3>庫存估值(依倉庫)</h3>
          <DataTable
            rows={val?.rows ?? []}
            columns={[
              { key: 'code', label: '倉庫' },
              { key: 'name', label: '名稱' },
              { key: 'value', label: '金額', align: 'right', render: (r) => money(r.value) },
            ]}
          />
          {val && <div className="total">合計 {money(val.total)}</div>}
        </div>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h3>損益表</h3>
        <DataTable
          rows={income?.rows ?? []}
          columns={[
            { key: 'code', label: '科目' },
            { key: 'name', label: '名稱' },
            { key: 'type', label: '類型', render: (r) => (r.type === 'REVENUE' ? '收入' : '費用') },
            { key: 'amount', label: '金額', align: 'right', render: (r) => money(r.amount) },
          ]}
        />
        {income && (
          <div className="total">
            收入 {money(income.revenue)} − 費用 {money(income.expense)} = 本期損益 {money(income.netIncome)}
          </div>
        )}
      </div>
    </section>
  );
}
