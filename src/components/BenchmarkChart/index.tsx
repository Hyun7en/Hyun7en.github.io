import './styles.css';

interface DataPoint {
  label: string;
  value: number;
  unit?: string;
}

interface Props {
  title?: string;
  data: DataPoint[];
}

export default function BenchmarkChart({ title, data }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="benchmark-chart">
      {title && <h4 className="benchmark-chart-title">{title}</h4>}
      <div className="benchmark-chart-bars">
        {data.map((d) => (
          <div className="benchmark-chart-row" key={d.label}>
            <span className="benchmark-chart-label">{d.label}</span>
            <div className="benchmark-chart-track">
              <div
                className="benchmark-chart-bar"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
            <span className="benchmark-chart-value">
              {d.value}
              {d.unit ?? ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
