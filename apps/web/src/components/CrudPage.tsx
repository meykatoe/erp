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
