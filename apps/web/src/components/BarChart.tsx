interface Props {
  data: { label: string; value: number }[];
  format?: (v: number) => string;
}

export function BarChart({ data, format = (v) => String(v) }: Props) {
  if (data.length === 0) return <p className="muted">尚無資料</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 100 / data.length;

  return (
    <svg className="bars" viewBox="0 0 600 220" preserveAspectRatio="none" role="img" aria-label="長條圖">
      {data.map((d, i) => {
        const h = (d.value / max) * 160;
        const x = i * (600 / data.length) + 8;
        const bw = 600 / data.length - 16;
        return (
          <g key={d.label}>
            <rect x={x} y={185 - h} width={bw} height={h} rx={3}>
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </rect>
            <text x={x + bw / 2} y={205} textAnchor="middle">
              {d.label.slice(2)}
            </text>
            <text x={x + bw / 2} y={178 - h} textAnchor="middle">
              {format(d.value)}
            </text>
          </g>
        );
      })}
      <title>{`${w}`}</title>
    </svg>
  );
}
