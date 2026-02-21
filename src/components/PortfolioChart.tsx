import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { date: string; value: number }[];
}

const PortfolioChart = ({ data }: Props) => {
  const startVal = data[0]?.value || 10000;
  const endVal = data[data.length - 1]?.value || 10000;
  const pnl = endVal - startVal;
  const pnlPct = ((pnl / startVal) * 100).toFixed(2);
  const isPositive = pnl >= 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Portfolio Value</h3>
        <div className="text-right">
          <p className="text-lg font-bold font-mono">₹{endVal.toLocaleString("en-IN")}</p>
          <p className={`text-xs font-mono ${isPositive ? "text-buy" : "text-sell"}`}>
            {isPositive ? "+" : ""}₹{pnl.toFixed(2)} ({pnlPct}%)
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data.map((d) => ({ ...d, date: d.date.slice(5) }))}>
          <defs>
            <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={["auto", "auto"]} tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 16%, 18%)", borderRadius: 8, color: "hsla(210, 7%, 88%, 1.00)", fontFamily: "JetBrains Mono" }} />
          <Area type="monotone" dataKey="value" stroke={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"} fill="url(#portfolioGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioChart;
