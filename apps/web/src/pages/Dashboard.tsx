import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { BarChart } from '../components/BarChart';
import { money } from '../lib/format';

type Data = Record<string, any>;

export function Dashboard() {
  const { user, can } = useAuth();
  const [d, setD] = useState<Data | null>(null);
  const [months, setMonths] = useState<{ month: string; total: number }[]>([]);
  const allowed = can('report:read');

  useEffect(() => {
    if (!allowed) return;
    api<Data>('/reports/dashboard').then(setD).catch(() => {});
    api<{ month: string; total: number }[]>('/reports/sales-by-month').then(setMonths).catch(() => {});
  }, [allowed]);

  if (!allowed) {
    return (
      <section>
        <div className="page-head">
          <h2>歡迎,{user?.name}</h2>
        </div>
        <p className="muted">請由左側選單進入您有權限的功能。</p>
      </section>
    );
  }

  const stats: [string, string, boolean?][] = d
    ? [
        ['本月銷售額', money(d.monthSales)],
        ['本月訂單數', String(d.monthOrders)],
        ['待處理銷售單', String(d.openSalesOrders)],
        ['待處理採購單', String(d.openPurchaseOrders)],
        ['應收帳款', money(d.receivable)],
        ['應付帳款', money(d.payable)],
        ['庫存總值', money(d.inventoryValue)],
        ['低庫存品項', String(d.lowStockCount), d.lowStockCount > 0],
      ]
    : [];

  return (
    <section>
      <div className="page-head">
        <h2>儀表板</h2>
      </div>
      <div className="grid">
        {stats.map(([label, value, warn]) => (
          <div key={label} className={`stat${warn ? ' warn' : ''}`}>
            <div className="label">{label}</div>
            <div className="value">{value}</div>
          </div>
        ))}
      </div>
      <div className="panel">
        <h3>近 12 個月銷售額</h3>
        <BarChart data={months.map((m) => ({ label: m.month, value: m.total }))} format={(v) => money(v)} />
      </div>
    </section>
  );
}
