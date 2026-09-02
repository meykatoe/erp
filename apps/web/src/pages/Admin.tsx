import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { CrudPage } from '../components/CrudPage';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { useList, usePaged } from '../hooks/usePaged';
import { useOptions } from '../hooks/useOptions';
import { datetime } from '../lib/format';

type Row = { id: string } & Record<string, any>;

export function UsersPage() {
  const { options } = useOptions<Row>('/roles', (r) => r.name);
  const toast = useToast();
  const { can } = useAuth();
  const [resetFor, setResetFor] = useState<Row | null>(null);
  const [pwd, setPwd] = useState('');

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api(`/users/${resetFor!.id}/reset-password`, { body: { password: pwd } });
      toast('ok', '密碼已重設');
      setResetFor(null);
      setPwd('');
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  return (
    <>
      <CrudPage<Row>
        title="使用者"
        endpoint="/users"
        readPerm="user:read"
        writePerm="user:write"
        toValues={(r) => ({ ...r, roleIds: undefined })}
        fields={[
          { name: 'email', label: '電子郵件', type: 'email', required: true, createOnly: true },
          { name: 'name', label: '姓名', required: true },
          { name: 'password', label: '初始密碼(至少 8 碼)', type: 'password', required: true, createOnly: true },
          { name: 'active', label: '啟用', type: 'checkbox', editOnly: true },
        ]}
        columns={[
          { key: 'email', label: '電子郵件' },
          { key: 'name', label: '姓名' },
          { key: 'roles', label: '角色', render: (r) => r.roles.map((x: Row) => x.role.name).join('、') },
          { key: 'active', label: '狀態', render: (r) => <StatusBadge status={r.active ? 'ACTIVE' : 'RESIGNED'} /> },
          {
            key: 'op',
            label: '',
            render: (r) =>
              can('user:write') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setResetFor(r);
                  }}
                >
                  重設密碼
                </button>
              ),
          },
        ]}
      />
      {options.length > 0 && <p className="muted">可用角色: {options.map((o) => o.label).join('、')}</p>}
      {resetFor && (
        <Modal title={`重設 ${resetFor.name} 的密碼`} onClose={() => setResetFor(null)}>
          <form className="form" onSubmit={reset}>
            <label>
              <span>新密碼</span>
              <input type="password" minLength={8} required value={pwd} onChange={(e) => setPwd(e.target.value)} />
            </label>
            <footer>
              <button className="primary">確認</button>
            </footer>
          </form>
        </Modal>
      )}
    </>
  );
}
