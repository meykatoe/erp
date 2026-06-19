import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { CrudPage } from '../components/CrudPage';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { usePaged } from '../hooks/usePaged';
import { date, money } from '../lib/format';
import { ACCOUNT_TYPE_LABEL } from '../lib/labels';

type Row = { id: string } & Record<string, any>;

export function AccountsPage() {
  return (
    <CrudPage<Row>
      title="會計科目"
      endpoint="/accounting/accounts"
      readPerm="accounting:read"
      writePerm="accounting:write"
      paged={false}
      fields={[
        { name: 'code', label: '科目代碼', required: true, createOnly: true },
        { name: 'name', label: '科目名稱', required: true },
        {
          name: 'type',
          label: '類型',
          type: 'select',
          required: true,
          createOnly: true,
          options: Object.entries(ACCOUNT_TYPE_LABEL).map(([value, label]) => ({ value, label })),
        },
        { name: 'active', label: '啟用', type: 'checkbox', editOnly: true },
      ]}
      columns={[
        { key: 'code', label: '代碼' },
        { key: 'name', label: '名稱' },
        { key: 'type', label: '類型', render: (r) => ACCOUNT_TYPE_LABEL[r.type] },
        { key: 'active', label: '狀態', render: (r) => <StatusBadge status={r.active ? 'ACTIVE' : 'RESIGNED'} /> },
      ]}
    />
  );
}

interface Line {
  code: string;
  debit: string;
  credit: string;
}

export function JournalsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const { data, loading, page, setPage, search, reload } = usePaged<Row>('/accounting/journals');
  const [open, setOpen] = useState(false);
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<Line[]>([
    { code: '', debit: '', credit: '' },
    { code: '', debit: '', credit: '' },
  ]);
  const [accounts, setAccounts] = useState<Row[]>([]);

  useEffect(() => {
    api<Row[]>('/accounting/accounts').then(setAccounts).catch(() => {});
  }, []);

  const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const balanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.005;

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((s) => s.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api('/accounting/journals', {
        body: {
          memo: memo || undefined,
          lines: lines.map((l) => ({ code: l.code, debit: Number(l.debit || 0), credit: Number(l.credit || 0) })),
        },
      });
      toast('ok', '傳票已過帳');
      setOpen(false);
      reload();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  const reverse = async (r: Row) => {
    if (!confirm(`確定沖銷傳票 ${r.no}?`)) return;
    try {
      await api(`/accounting/journals/${r.id}/reverse`, { method: 'POST', body: {} });
      toast('ok', '已沖銷');
      reload();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h2>傳票</h2>
        <div className="actions">
          <input className="search" placeholder="搜尋單號或摘要…" onChange={(e) => search(e.target.value)} />
          {can('accounting:write') && (
            <button className="primary" onClick={() => setOpen(true)}>
              新增傳票
            </button>
          )}
        </div>
      </div>
      <DataTable
        loading={loading}
        rows={data?.items ?? []}
        columns={[
          { key: 'no', label: '單號' },
          { key: 'date', label: '日期', render: (r) => date(r.date) },
          { key: 'memo', label: '摘要' },
          {
            key: 'lines',
            label: '分錄',
            render: (r) => r.lines.map((l: Row) => `${l.account.code}${Number(l.debit) ? ` 借${money(l.debit)}` : ` 貸${money(l.credit)}`}`).join(' / '),
          },
          { key: 'status', label: '狀態', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'op',
            label: '',
            render: (r) =>
              can('accounting:write') && r.status === 'POSTED' && r.source !== 'REVERSAL' ? (
                <button className="danger" onClick={() => reverse(r)}>
                  沖銷
                </button>
              ) : null,
          },
        ]}
      />
      {data && <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
      {open && (
        <Modal title="新增傳票" onClose={() => setOpen(false)} wide>
          <form className="form" onSubmit={submit}>
            <label>
              <span>摘要</span>
              <input value={memo} onChange={(e) => setMemo(e.target.value)} />
            </label>
            <div className="table-wrap items-edit">
              <table>
                <thead>
                  <tr>
                    <th>科目</th>
                    <th className="num">借方</th>
                    <th className="num">貸方</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td>
                        <select required value={l.code} onChange={(e) => setLine(i, { code: e.target.value })}>
                          <option value="">請選擇</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.code}>
                              {a.code} {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input type="number" min="0" step="0.01" value={l.debit} onChange={(e) => setLine(i, { debit: e.target.value, credit: '' })} />
                      </td>
                      <td>
                        <input type="number" min="0" step="0.01" value={l.credit} onChange={(e) => setLine(i, { credit: e.target.value, debit: '' })} />
                      </td>
                      <td>
                        {lines.length > 2 && (
                          <button type="button" onClick={() => setLines((s) => s.filter((_, idx) => idx !== i))}>
                            移除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setLines((s) => [...s, { code: '', debit: '', credit: '' }])}>
              新增明細
            </button>
            <div className="total">
              借 {money(totalDebit)} / 貸 {money(totalCredit)} {balanced ? '✓ 平衡' : '✗ 不平衡'}
            </div>
            <footer>
              <button className="primary" disabled={!balanced}>
                過帳
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </section>
  );
}

export function InvoicesPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [kind, setKind] = useState<'AR' | 'AP'>('AR');
  const { data, loading, page, setPage, reload } = usePaged<Row>('/accounting/invoices', { kind });
  const [aging, setAging] = useState<Row | null>(null);
  const [paying, setPaying] = useState<Row | null>(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    api<Row>(`/accounting/aging/${kind}`).then(setAging).catch(() => setAging(null));
  }, [kind, data]);

  const pay = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api(`/accounting/invoices/${paying!.id}/pay`, { body: { amount: Number(amount) } });
      toast('ok', kind === 'AR' ? '收款完成' : '付款完成');
      setPaying(null);
      reload();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  const b = aging?.buckets;
  return (
    <section>
      <div className="page-head">
        <h2>應收應付</h2>
        <div className="tabs">
          <button className={kind === 'AR' ? 'on' : ''} onClick={() => (setKind('AR'), setPage(1))}>
            應收帳款
          </button>
          <button className={kind === 'AP' ? 'on' : ''} onClick={() => (setKind('AP'), setPage(1))}>
            應付帳款
          </button>
        </div>
      </div>
      {b && (
        <div className="grid">
          {[
            ['未到期', b.current],
            ['逾期 1-30 天', b.d30],
            ['逾期 31-60 天', b.d60],
            ['逾期 61-90 天', b.d90],
            ['逾期 90 天以上', b.over90],
          ].map(([label, v]) => (
            <div key={label as string} className="stat">
              <div className="label">{label as string}</div>
              <div className="value">{money(v as string)}</div>
            </div>
          ))}
        </div>
      )}
      <DataTable
        loading={loading}
        rows={data?.items ?? []}
        columns={[
          { key: 'no', label: '單號' },
          { key: 'party', label: kind === 'AR' ? '客戶' : '供應商', render: (r) => r.customer?.name ?? r.supplier?.name },
          { key: 'issueDate', label: '開立日', render: (r) => date(r.issueDate) },
          { key: 'dueDate', label: '到期日', render: (r) => date(r.dueDate) },
          { key: 'amount', label: '金額', align: 'right', render: (r) => money(r.amount) },
          { key: 'paid', label: '已收付', align: 'right', render: (r) => money(r.paidAmount) },
          { key: 'left', label: '未結', align: 'right', render: (r) => money(Number(r.amount) - Number(r.paidAmount)) },
          { key: 'status', label: '狀態', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'op',
            label: '',
            render: (r) =>
              can('accounting:write') && (r.status === 'UNPAID' || r.status === 'PARTIAL') ? (
                <button
                  onClick={() => {
                    setPaying(r);
                    setAmount(String(Number(r.amount) - Number(r.paidAmount)));
                  }}
                >
                  {kind === 'AR' ? '收款' : '付款'}
                </button>
              ) : null,
          },
        ]}
      />
      {data && <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
      {paying && (
        <Modal title={`${kind === 'AR' ? '收款' : '付款'} ${paying.no}`} onClose={() => setPaying(null)}>
          <form className="form" onSubmit={pay}>
            <label>
              <span>金額</span>
              <input type="number" step="0.01" min="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <footer>
              <button className="primary">確認</button>
            </footer>
          </form>
        </Modal>
      )}
    </section>
  );
}
