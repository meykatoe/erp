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
