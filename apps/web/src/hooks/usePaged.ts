import { useCallback, useEffect, useState } from 'react';
import { api, Page } from '../api/client';

export function usePaged<T>(path: string, extra: Record<string, string | undefined> = {}) {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<Page<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const extraKey = JSON.stringify(extra);

  const reload = useCallback(() => {
    setLoading(true);
    api<Page<T>>(path, { query: { page, keyword, ...JSON.parse(extraKey) } })
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path, page, keyword, extraKey]);

  useEffect(reload, [reload]);

  const search = (k: string) => {
    setPage(1);
    setKeyword(k);
  };

  return { data, loading, error, page, setPage, search, reload };
}

export function useList<T>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    setLoading(true);
    api<T[]>(path)
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(reload, [reload]);
  return { data, loading, error, reload };
}
