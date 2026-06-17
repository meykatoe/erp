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
