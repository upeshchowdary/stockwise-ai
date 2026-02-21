import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  symbol: string;
  name: string;
  currentPrice: number;
  balance: number;
  holdings: number;
  prediction?: number;
  signal?: string;
  onTrade: (type: "BUY" | "SELL", quantity: number) => Promise<void>;
}

const TradePanel = ({ symbol, name, currentPrice, balance, holdings, prediction, signal, onTrade }: Props) => {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const maxBuy = Math.floor(balance / currentPrice);
  const total = qty * currentPrice;

  const handleTrade = async (type: "BUY" | "SELL") => {
    setLoading(true);
    try {
      await onTrade(type, qty);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Trade</h3>
        {signal && (
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
            signal === "BUY" ? "bg-buy text-buy" : signal === "SELL" ? "bg-sell text-sell" : "bg-hold text-hold"
          }`}>
            AI: {signal} ({((prediction || 0.5) * 100).toFixed(0)}%)
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Price</p>
          <p className="font-mono font-bold text-foreground">₹{currentPrice.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Holdings</p>
          <p className="font-mono font-bold text-foreground">{holdings} shares</p>
        </div>
        <div>
          <p className="text-muted-foreground">Balance</p>
          <p className="font-mono font-bold text-foreground">₹{balance.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Max Buy</p>
          <p className="font-mono font-bold text-foreground">{maxBuy}</p>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Quantity</label>
        <Input
          type="number"
          min={1}
          max={maxBuy || holdings}
          value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          className="font-mono bg-secondary border-border mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          Total: ₹{total.toFixed(2)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => handleTrade("BUY")}
          disabled={loading || qty < 1 || total > balance}
          className="bg-chart-green hover:bg-chart-green/80 text-primary-foreground font-bold"
        >
          <TrendingUp className="w-4 h-4 mr-1" /> BUY
        </Button>
        <Button
          onClick={() => handleTrade("SELL")}
          disabled={loading || qty < 1 || qty > holdings}
          className="bg-chart-red hover:bg-chart-red/80 text-destructive-foreground font-bold"
        >
          <TrendingDown className="w-4 h-4 mr-1" /> SELL
        </Button>
      </div>
    </div>
  );
};

export default TradePanel;
