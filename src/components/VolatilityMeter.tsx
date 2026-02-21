interface Props {
  value: number;
}

const VolatilityMeter = ({ value }: Props) => {
  const pct = Math.min(value * 100, 10); // cap display at 10%
  const level = pct > 5 ? "High" : pct > 2 ? "Medium" : "Low";
  const color = pct > 5 ? "text-chart-red" : pct > 2 ? "text-chart-yellow" : "text-chart-green";
  const barColor = pct > 5 ? "bg-chart-red" : pct > 2 ? "bg-chart-yellow" : "bg-chart-green";

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Volatility</span>
      <div className="mt-2">
        <p className={`text-2xl font-bold font-mono ${color}`}>{(value * 100).toFixed(2)}%</p>
        <p className={`text-[10px] font-medium ${color}`}>{level}</p>
      </div>
      <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct * 10}%` }} />
      </div>
    </div>
  );
};

export default VolatilityMeter;
