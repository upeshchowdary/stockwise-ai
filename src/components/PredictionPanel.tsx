import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  signal: "BUY" | "SELL" | "HOLD";
  probability: number;
  support: number;
  resistance: number;
  momentum: number;
}

const PredictionPanel = ({ signal, probability, support, resistance, momentum }: Props) => {
  const config = {
    BUY: { icon: TrendingUp, color: "text-chart-green", bg: "bg-chart-green/10", border: "border-chart-green/30", label: "BUY — Price likely to rise" },
    SELL: { icon: TrendingDown, color: "text-chart-red", bg: "bg-chart-red/10", border: "border-chart-red/30", label: "SELL — Price likely to fall" },
    HOLD: { icon: Minus, color: "text-chart-yellow", bg: "bg-chart-yellow/10", border: "border-chart-yellow/30", label: "HOLD — No clear direction" },
  };
  const cfg = config[signal];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} p-6`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">AI Signal</span>
        <div className={`${cfg.color} px-3 py-1 rounded-full text-sm font-bold font-mono flex items-center gap-1.5 border ${cfg.border}`}>
          <Icon className="w-4 h-4" />
          {signal}
        </div>
      </div>
      <p className={`text-xs ${cfg.color} font-medium mb-4`}>{cfg.label}</p>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Confidence</span>
          <span className={`font-mono font-bold ${cfg.color}`}>{(probability * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1.5">
          <div className={`h-1.5 rounded-full transition-all duration-500 ${signal === "BUY" ? "bg-chart-green" : signal === "SELL" ? "bg-chart-red" : "bg-chart-yellow"}`} style={{ width: `${probability * 100}%` }} />
        </div>
        <div className="flex justify-between pt-2">
          <span className="text-muted-foreground">Support</span>
          <span className="font-mono font-bold text-foreground">${support.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Resistance</span>
          <span className="font-mono font-bold text-foreground">${resistance.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Momentum</span>
          <span className={`font-mono font-bold ${momentum > 0 ? "text-chart-green" : momentum < 0 ? "text-chart-red" : "text-muted-foreground"}`}>
            {momentum > 0 ? "+" : ""}{(momentum * 100).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PredictionPanel;
