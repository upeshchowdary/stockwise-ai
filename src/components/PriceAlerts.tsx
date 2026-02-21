import { useState } from "react";
import { Bell, BellRing, X, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: "above" | "below";
  triggered: boolean;
}

interface Props {
  symbol: string;
  currentPrice: number;
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, "id" | "triggered">) => void;
  onRemoveAlert: (id: string) => void;
}

const PriceAlerts = ({ symbol, currentPrice, alerts, onAddAlert, onRemoveAlert }: Props) => {
  const [price, setPrice] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");

  const handleAdd = () => {
    const val = parseFloat(price);
    if (!val || val <= 0) return;
    onAddAlert({ symbol, targetPrice: val, direction });
    setPrice("");
  };

  const symbolAlerts = alerts.filter((a) => a.symbol === symbol);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Price Alerts</h3>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex border border-border rounded-md overflow-hidden text-xs">
          <button
            onClick={() => setDirection("above")}
            className={`px-2.5 py-1.5 flex items-center gap-1 transition-colors ${
              direction === "above" ? "bg-chart-green/15 text-chart-green" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <TrendingUp className="w-3 h-3" /> Above
          </button>
          <button
            onClick={() => setDirection("below")}
            className={`px-2.5 py-1.5 flex items-center gap-1 transition-colors ${
              direction === "below" ? "bg-chart-red/15 text-chart-red" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <TrendingDown className="w-3 h-3" /> Below
          </button>
        </div>
        <Input
          type="number"
          placeholder={`e.g. ${currentPrice.toFixed(0)}`}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="font-mono text-xs h-8 flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button size="sm" onClick={handleAdd} className="h-8 text-xs px-3">
          Add
        </Button>
      </div>

      {symbolAlerts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">No alerts set for {symbol}</p>
      ) : (
        <div className="space-y-1.5 max-h-[180px] overflow-auto">
          {symbolAlerts.map((a) => (
            <div
              key={a.id}
              className={`flex items-center justify-between px-3 py-2 rounded text-xs font-mono border transition-colors ${
                a.triggered
                  ? "bg-chart-yellow/10 border-chart-yellow/30"
                  : "bg-secondary/30 border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                {a.triggered ? (
                  <BellRing className="w-3.5 h-3.5 text-chart-yellow animate-pulse" />
                ) : a.direction === "above" ? (
                  <TrendingUp className="w-3.5 h-3.5 text-chart-green" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-chart-red" />
                )}
                <span className={a.direction === "above" ? "text-chart-green" : "text-chart-red"}>
                  {a.direction === "above" ? "↑" : "↓"} ${a.targetPrice.toFixed(2)}
                </span>
                {a.triggered && <span className="text-chart-yellow font-bold">TRIGGERED!</span>}
              </div>
              <button onClick={() => onRemoveAlert(a.id)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriceAlerts;
