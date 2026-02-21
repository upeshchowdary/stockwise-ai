interface PortfolioItem {
  id: number;
  symbol: string;
  name: string;
  quantity: number;
  avg_buy_price: number;
  created_at?: string;
  updated_at?: string;
}

interface Props {
  portfolio: PortfolioItem[];
  currentPrices: Record<string, number>;
}

const PortfolioTable = ({ portfolio, currentPrices }: Props) => {
  if (portfolio.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Portfolio Holdings</h3>
        <p className="text-xs text-muted-foreground text-center py-4">No holdings yet. Search a stock and buy!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Portfolio Holdings</h3>
      <div className="space-y-2 max-h-[250px] overflow-auto">
        {portfolio.map((h) => {
          const current = currentPrices[h.symbol] || h.avg_buy_price;
          const pnl = (current - h.avg_buy_price) * h.quantity;
          const pnlPct = ((current - h.avg_buy_price) / h.avg_buy_price * 100);
          const isPositive = pnl >= 0;

          return (
            <div key={h.id} className="flex items-center justify-between px-3 py-2 rounded bg-secondary/30 border border-border">
              <div>
                <p className="font-mono font-bold text-sm">{h.symbol}</p>
                <p className="text-xs text-muted-foreground">{h.quantity} × ₹{h.avg_buy_price.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">₹{(current * h.quantity).toFixed(2)}</p>
                <p className={`text-xs font-mono font-bold ${isPositive ? "text-buy" : "text-sell"}`}>
                  {isPositive ? "+" : ""}₹{pnl.toFixed(2)} ({pnlPct.toFixed(1)}%)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortfolioTable;
