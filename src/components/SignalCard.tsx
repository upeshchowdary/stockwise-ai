import { Prediction } from "@/lib/mockData";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  prediction: Prediction;
  currentPrice: number;
}

const SignalCard = ({ prediction, currentPrice }: Props) => {
  const { signal, probability, confidence } = prediction;
  const signalConfig = {
    BUY: { icon: TrendingUp, colorClass: "text-buy", bgClass: "bg-buy", glowClass: "glow-green" },
    SELL: { icon: TrendingDown, colorClass: "text-sell", bgClass: "bg-sell", glowClass: "glow-red" },
    HOLD: { icon: Minus, colorClass: "text-hold", bgClass: "bg-hold", glowClass: "" },
  };
  const cfg = signalConfig[signal];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-lg border border-border bg-card p-6 ${cfg.glowClass} transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">ML Signal</span>
        <div className={`${cfg.bgClass} ${cfg.colorClass} px-3 py-1 rounded-full text-sm font-bold font-mono flex items-center gap-1.5`}>
          <Icon className="w-4 h-4" />
          {signal}
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Current Price</p>
          <p className="text-2xl font-bold font-mono">₹{currentPrice.toLocaleString("en-IN")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Probability</p>
            <p className={`text-lg font-bold font-mono ${cfg.colorClass}`}>{(probability * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Confidence</p>
            <p className="text-lg font-bold font-mono">{(confidence * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;
