import { FormEvent, ReactNode, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { usePaged, useList } from '../hooks/usePaged';
import { Column, DataTable } from './DataTable';
import { Modal } from './Modal';
import { Pagination } from './Pagination';
import { useToast } from './Toast';

export interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'date' | 'checkbox' | 'select' | 'textarea' | 'password';
  required?: boolean;
  options?: { value: string; label: string }[];
  createOnly?: boolean;
  editOnly?: boolean;
  step?: string;
}

interface Props<T> {
  title: string;
  endpoint: string;
  readPerm: string;
  writePerm?: string;
  columns: Column<T>[];
  fields: FieldDef[];
  paged?: boolean;
  searchable?: boolean;
  allowEdit?: boolean;
  allowCreate?: boolean;
  extra?: ReactNode;
  patchMethod?: 'PATCH' | 'PUT';
  toValues?: (row: T) => Record<string, unknown>;
}

type Row = { id: string } & Record<string, unknown>;

function initialValues(fields: FieldDef[], row?: Row) {
  const v: Record<string, unknown> = {};
  for (const f of fields) {
    const cur = row?.[f.name];
    v[f.name] = cur ?? (f.type === 'checkbox' ? true : '');
    if (f.type === 'date' && typeof cur === 'string') v[f.name] = cur.slice(0, 10);
  }
  return v;
}

function toBody(fields: FieldDef[], values: Record<string, unknown>, editing: boolean) {
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    if (editing && f.createOnly) continue;
    if (!editing && f.editOnly) continue;
    const v = values[f.name];
    if (f.type === 'checkbox') body[f.name] = !!v;
    else if (v === '' || v === undefined) continue;
    else body[f.name] = f.type === 'number' ? Number(v) : v;
  }
  return body;
}

export function CrudPage<T extends { id: string }>(p: Props<T>) {
  const { can } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);

  const pagedState = usePaged<T>(p.paged === false ? null : p.endpoint);
  const listState = useList<T>(p.paged === false ? p.endpoint : null);
  const rows = p.paged === false ? listState.data : (pagedState.data?.items ?? []);
  const loading = p.paged === false ? listState.loading : pagedState.loading;
  const error = p.paged === false ? listState.error : pagedState.error;
  const reload = p.paged === false ? listState.reload : pagedState.reload;

  const writable = !!p.writePerm && can(p.writePerm);

  const openCreate = () => {
    setValues(initialValues(p.fields.filter((f) => !f.editOnly)));
    setCreating(true);
  };
  const openEdit = (row: T) => {
    if (!writable || p.allowEdit === false) return;
    const r = (p.toValues ? p.toValues(row) : row) as Row;
    setValues(initialValues(p.fields.filter((f) => !f.createOnly), r));
    setEditing(row as unknown as Row);
  };
  const close = () => {
    setEditing(null);
    setCreating(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await api(`${p.endpoint}/${editing.id}`, {
          method: p.patchMethod ?? 'PATCH',
          body: toBody(p.fields, values, true),
        });
      } else {
        await api(p.endpoint, { body: toBody(p.fields, values, false) });
      }
      toast('ok', '已儲存');
      close();
      reload();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const visible = p.fields.filter((f) => (editing ? !f.createOnly : !f.editOnly));

  return (
    <section>
      <div className="page-head">
        <h2>{p.title}</h2>
        <div className="actions">
          {p.searchable !== false && p.paged !== false && (
            <input
              className="search"
              placeholder="搜尋…"
              onChange={(e) => pagedState.search(e.target.value)}
            />
          )}
          {p.extra}
          {writable && p.allowCreate !== false && (
            <button className="primary" onClick={openCreate}>
              新增
            </button>
          )}
        </div>
      </div>
      {error && <div className="alert">{error}</div>}
      <DataTable
        columns={p.columns}
        rows={rows}
        loading={loading}
        onRowClick={writable && p.allowEdit !== false ? openEdit : undefined}
      />
      {p.paged !== false && pagedState.data && (
        <Pagination
          page={pagedState.page}
          totalPages={pagedState.data.totalPages}
          total={pagedState.data.total}
          onChange={pagedState.setPage}
        />
      )}
      {(creating || editing) && (
        <Modal title={`${editing ? '編輯' : '新增'}${p.title}`} onClose={close}>
          <form onSubmit={submit} className="form">
            {visible.map((f) => (
              <label key={f.name} className={f.type === 'checkbox' ? 'check' : undefined}>
                <span>
                  {f.label}
                  {f.required && !editing ? ' *' : ''}
                </span>
                {f.type === 'select' ? (
                  <select
                    value={String(values[f.name] ?? '')}
                    required={f.required}
                    onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  >
                    <option value="">請選擇</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    value={String(values[f.name] ?? '')}
                    onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  />
                ) : f.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={!!values[f.name]}
                    onChange={(e) => setValues({ ...values, [f.name]: e.target.checked })}
                  />
                ) : (
                  <input
                    type={f.type ?? 'text'}
                    step={f.type === 'number' ? (f.step ?? 'any') : undefined}
                    required={f.required && !editing}
                    value={String(values[f.name] ?? '')}
                    onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  />
                )}
              </label>
            ))}
            <footer>
              <button type="button" onClick={close}>
                取消
              </button>
              <button className="primary" disabled={busy}>
                {busy ? '儲存中…' : '儲存'}
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </section>
  );
}
