import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  align?: 'right' | 'left';
  render?: (row: T) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  empty?: string;
  onRowClick?: (row: T) => void;
}
