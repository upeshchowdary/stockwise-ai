interface TradeItem {
  id: number;
  symbol: string;
  name: string;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  total: number;
  created_at: string;
}

interface Props {
  trades: TradeItem[];
}

const TradeHistory = ({ trades }: Props) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Trade History</h3>
    <div className="max-h-[250px] overflow-auto space-y-1">
      {trades.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No trades yet</p>
      )}
      {trades.map((t) => (
        <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded bg-secondary/20 text-xs">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded font-bold font-mono ${t.type === "BUY" ? "bg-buy text-buy" : "bg-sell text-sell"}`}>
              {t.type}
            </span>
            <span className="font-mono font-bold">{t.symbol}</span>
          </div>
          <div className="text-right font-mono">
            <span>{t.quantity} × ₹{t.price.toFixed(2)}</span>
            <span className="text-muted-foreground ml-2">{new Date(t.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TradeHistory;
