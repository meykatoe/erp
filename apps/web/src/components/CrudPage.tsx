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
