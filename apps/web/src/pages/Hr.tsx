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
