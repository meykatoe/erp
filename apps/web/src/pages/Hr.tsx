import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { CrudPage } from '../components/CrudPage';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { useOptions } from '../hooks/useOptions';
import { useList } from '../hooks/usePaged';
import { date, datetime, money, today } from '../lib/format';
import { LEAVE_LABEL } from '../lib/labels';

type Row = { id: string } & Record<string, any>;

export function EmployeesPage() {
  const { options } = useOptions<Row>('/hr/departments', (d) => d.name);
  return (
    <CrudPage<Row>
      title="員工"
      endpoint="/hr/employees"
      readPerm="hr:read"
      writePerm="hr:write"
      fields={[
        { name: 'name', label: '姓名', required: true },
        { name: 'departmentId', label: '部門', type: 'select', options },
        { name: 'title', label: '職稱' },
        { name: 'hireDate', label: '到職日', type: 'date', required: true, createOnly: true },
        { name: 'salary', label: '月薪', type: 'number', required: true },
        { name: 'email', label: '電子郵件', type: 'email' },
        { name: 'phone', label: '電話' },
        {
          name: 'status',
          label: '狀態',
          type: 'select',
          editOnly: true,
          options: [
            { value: 'ACTIVE', label: '在職' },
            { value: 'ON_LEAVE', label: '留職停薪' },
            { value: 'RESIGNED', label: '離職' },
          ],
        },
      ]}
      columns={[
        { key: 'no', label: '工號' },
        { key: 'name', label: '姓名' },
        { key: 'dept', label: '部門', render: (r) => r.department?.name ?? '' },
        { key: 'title', label: '職稱' },
        { key: 'hireDate', label: '到職日', render: (r) => date(r.hireDate) },
        { key: 'salary', label: '月薪', align: 'right', render: (r) => money(r.salary) },
        { key: 'status', label: '狀態', render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}

export function DepartmentsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const { data, loading, reload } = useList<Row>('/hr/departments');
  const [name, setName] = useState('');

  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api('/hr/departments', { body: { name } });
      setName('');
      reload();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  const remove = async (r: Row) => {
    try {
      await api(`/hr/departments/${r.id}`, { method: 'DELETE' });
      reload();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h2>部門</h2>
        {can('hr:write') && (
          <form className="actions" onSubmit={add}>
            <input placeholder="部門名稱" value={name} onChange={(e) => setName(e.target.value)} required />
            <button className="primary">新增</button>
          </form>
        )}
      </div>
      <DataTable
        loading={loading}
        rows={data}
        columns={[
          { key: 'name', label: '部門' },
          { key: 'count', label: '人數', align: 'right', render: (r) => r._count.employees },
          {
            key: 'op',
            label: '',
            render: (r) => can('hr:write') && <button className="danger" onClick={() => remove(r)}>刪除</button>,
          },
        ]}
      />
    </section>
  );
}

export function AttendancePage() {
  const { can } = useAuth();
  const toast = useToast();
  const { options } = useOptions<Row>('/hr/employees', (e) => `${e.no} ${e.name}`);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api<Row[]>('/hr/attendance', { query: { employeeId, month } })
      .then(setRows)
      .finally(() => setLoading(false));
  };
  useEffect(load, [employeeId, month]);

  const clock = async (kind: 'clock-in' | 'clock-out') => {
    if (!employeeId) return toast('error', '請先選擇員工');
    try {
      await api(`/hr/attendance/${kind}`, { body: { employeeId } });
      toast('ok', kind === 'clock-in' ? '上班打卡成功' : '下班打卡成功');
      load();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h2>考勤</h2>
        <div className="actions">
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">全部員工</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          {can('hr:write') && (
            <>
              <button onClick={() => clock('clock-in')}>上班打卡</button>
              <button onClick={() => clock('clock-out')}>下班打卡</button>
            </>
          )}
        </div>
      </div>
      <DataTable
        loading={loading}
        rows={rows}
        columns={[
          { key: 'date', label: '日期', render: (r) => date(r.date) },
          { key: 'emp', label: '員工', render: (r) => `${r.employee.no} ${r.employee.name}` },
          { key: 'in', label: '上班', render: (r) => (r.checkIn ? datetime(r.checkIn) : '-') },
          { key: 'out', label: '下班', render: (r) => (r.checkOut ? datetime(r.checkOut) : '-') },
          { key: 'status', label: '狀態', render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </section>
  );
}

export function LeavesPage() {
  const { can } = useAuth();
  const toast = useToast();
  const { options } = useOptions<Row>('/hr/employees', (e) => `${e.no} ${e.name}`);
  const { data, loading, reload } = useList<Row>('/hr/leaves');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ type: 'ANNUAL', startDate: today(), endDate: today() });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api('/hr/leaves', { body: { ...form, reason: form.reason || undefined } });
      toast('ok', '已送出申請');
      setOpen(false);
      reload();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  const decide = async (r: Row, action: 'approve' | 'reject') => {
    try {
      await api(`/hr/leaves/${r.id}/${action}`, { body: {} });
      reload();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h2>請假</h2>
        {can('hr:write') && (
          <button className="primary" onClick={() => setOpen(true)}>
            新增申請
          </button>
        )}
      </div>
      <DataTable
        loading={loading}
        rows={data}
        columns={[
          { key: 'emp', label: '員工', render: (r) => `${r.employee.no} ${r.employee.name}` },
          { key: 'type', label: '假別', render: (r) => LEAVE_LABEL[r.type] },
          { key: 'start', label: '起', render: (r) => date(r.startDate) },
          { key: 'end', label: '迄', render: (r) => date(r.endDate) },
          { key: 'days', label: '天數', align: 'right' },
          { key: 'reason', label: '事由' },
          { key: 'status', label: '狀態', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'op',
            label: '',
            render: (r) =>
              can('hr:write') && r.status === 'PENDING' ? (
                <span className="actions">
                  <button onClick={() => decide(r, 'approve')}>核准</button>
                  <button className="danger" onClick={() => decide(r, 'reject')}>駁回</button>
                </span>
              ) : null,
          },
        ]}
      />
      {open && (
        <Modal title="請假申請" onClose={() => setOpen(false)}>
          <form className="form" onSubmit={submit}>
            <label>
              <span>員工</span>
              <select required value={form.employeeId ?? ''} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                <option value="">請選擇</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>假別</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(LEAVE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>開始日</span>
              <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </label>
            <label>
              <span>結束日</span>
              <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </label>
            <label>
              <span>事由</span>
              <input value={form.reason ?? ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
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
