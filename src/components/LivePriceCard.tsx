import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  lastUpdated: Date | null;
}

const LivePriceCard = ({ symbol, name, price, change, changePct, lastUpdated }: Props) => {
  const isUp = change > 0;
  const isDown = change < 0;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Live Price</span>
        <span className="text-[10px] text-muted-foreground font-mono">
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg font-bold font-mono">{symbol}</span>
        <span className="text-xs text-muted-foreground truncate">{name}</span>
      </div>
      <p className="text-3xl font-bold font-mono mb-2">
        ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${
        isUp ? "text-chart-green" : isDown ? "text-chart-red" : "text-muted-foreground"
      }`}>
        {isUp ? <TrendingUp className="w-4 h-4" /> : isDown ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
        {change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%)
      </div>
    </div>
  );
};

export default LivePriceCard;
