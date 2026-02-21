interface Props {
  value: number;
}

const RSIGauge = ({ value }: Props) => {
  const label = value > 70 ? "Overbought" : value < 30 ? "Oversold" : "Neutral";
  const color = value > 70 ? "text-chart-red" : value < 30 ? "text-chart-green" : "text-chart-yellow";
  const barColor = value > 70 ? "bg-chart-red" : value < 30 ? "bg-chart-green" : "bg-chart-yellow";

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">RSI (14)</span>
      <div className="mt-2">
        <p className={`text-2xl font-bold font-mono ${color}`}>{value.toFixed(1)}</p>
        <p className={`text-[10px] font-medium ${color}`}>{label}</p>
      </div>
      <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

export default RSIGauge;
