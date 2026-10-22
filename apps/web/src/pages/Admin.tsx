import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { CrudPage } from '../components/CrudPage';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { ActiveBadge, OkBadge } from '../components/StatusBadge';
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
          { key: 'active', label: '狀態', render: (r) => <ActiveBadge active={r.active} /> },
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

export function RolesPage() {
  const { data, reload } = useList<Row>('/roles');
  const { can } = useAuth();
  const toast = useToast();
  const [all, setAll] = useState<string[]>([]);
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [perms, setPerms] = useState<string[]>([]);

  useEffect(() => {
    api<string[]>('/roles/permissions').then(setAll).catch(() => {});
  }, []);

  const open = (r: Row | 'new') => {
    setEditing(r);
    setName(r === 'new' ? '' : r.name);
    setDesc(r === 'new' ? '' : (r.description ?? ''));
    setPerms(r === 'new' ? [] : r.permissions);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing === 'new') {
        await api('/roles', { body: { name, description: desc, permissions: perms } });
      } else if (editing) {
        await api(`/roles/${editing.id}`, { method: 'PATCH', body: { description: desc, permissions: perms } });
      }
      toast('ok', '已儲存');
      setEditing(null);
      reload();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  const remove = async (r: Row) => {
    if (!confirm(`確定刪除角色 ${r.name}?`)) return;
    try {
      await api(`/roles/${r.id}`, { method: 'DELETE' });
      reload();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  const toggle = (p: string) => setPerms((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  return (
    <section>
      <div className="page-head">
        <h2>角色權限</h2>
        {can('role:write') && (
          <button className="primary" onClick={() => open('new')}>
            新增角色
          </button>
        )}
      </div>
      <DataTable
        rows={data}
        columns={[
          { key: 'name', label: '角色' },
          { key: 'description', label: '說明' },
          { key: 'perms', label: '權限數', align: 'right', render: (r) => r.permissions.length },
          { key: 'users', label: '使用者數', align: 'right', render: (r) => r._count.users },
          {
            key: 'op',
            label: '',
            render: (r) =>
              can('role:write') && r.name !== 'admin' ? (
                <button className="danger" onClick={(e) => (e.stopPropagation(), remove(r))}>
                  刪除
                </button>
              ) : null,
          },
        ]}
        onRowClick={can('role:write') ? open : undefined}
      />
      {editing && (
        <Modal title={editing === 'new' ? '新增角色' : `編輯 ${editing.name}`} onClose={() => setEditing(null)} wide>
          <form className="form" onSubmit={save}>
            {editing === 'new' && (
              <label>
                <span>角色名稱</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
            )}
            <label>
              <span>說明</span>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} />
            </label>
            <div className="perm-grid">
              {all.map((p) => (
                <label key={p} className="check">
                  <input type="checkbox" checked={perms.includes(p)} onChange={() => toggle(p)} />
                  <span>{p}</span>
                </label>
              ))}
            </div>
            <footer>
              <button type="button" onClick={() => setEditing(null)}>
                取消
              </button>
              <button className="primary">儲存</button>
            </footer>
          </form>
        </Modal>
      )}
    </section>
  );
}

export function AuditPage() {
  const { data, loading, page, setPage, search } = usePaged<Row>('/audit-logs');
  return (
    <section>
      <div className="page-head">
        <h2>稽核紀錄</h2>
        <input className="search" placeholder="依路徑搜尋…" onChange={(e) => search(e.target.value)} />
      </div>
      <DataTable
        loading={loading}
        rows={data?.items ?? []}
        columns={[
          { key: 'createdAt', label: '時間', render: (r) => datetime(r.createdAt) },
          { key: 'user', label: '使用者', render: (r) => r.user?.name ?? '-' },
          { key: 'action', label: '動作' },
          { key: 'entity', label: '路徑' },
          { key: 'status', label: '結果', render: (r) => <OkBadge ok={r.status < 400} yes="成功" no="失敗" /> },
          { key: 'ip', label: 'IP' },
        ]}
      />
      {data && <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
    </section>
  );
}
