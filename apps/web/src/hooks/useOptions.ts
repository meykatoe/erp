import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Opt {
  value: string;
  label: string;
}

export function useOptions<T extends { id: string }>(
  endpoint: string,
  label: (row: T) => string,
  query: Record<string, string | number> = { pageSize: 200 },
) {
  const [options, setOptions] = useState<Opt[]>([]);
  const [rows, setRows] = useState<T[]>([]);
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    api<T[] | { items: T[] }>(endpoint, { query: JSON.parse(queryKey) })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.items;
        setRows(list);
        setOptions(list.map((r) => ({ value: r.id, label: label(r) })));
      })
      .catch(() => setOptions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, queryKey]);

  return { options, rows };
}
