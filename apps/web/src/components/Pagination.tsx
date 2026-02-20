interface Props {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onChange }: Props) {
  return (
    <div className="pagination">
      <span>共 {total} 筆</span>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        上一頁
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        下一頁
      </button>
    </div>
  );
}
