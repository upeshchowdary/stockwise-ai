import { useState } from "react";
import { StockQuoteData } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  data: StockQuoteData[];
}

const PriceTable = ({ data }: Props) => {
  const [showAll, setShowAll] = useState(false);
  const reversed = [...data].reverse();
  const displayed = showAll ? reversed : reversed.slice(0, 15);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Price History</h3>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-primary font-mono hover:underline"
        >
          {showAll ? "Show Less" : `Show All (${data.length})`}
        </button>
      </div>
      <div className="overflow-auto max-h-[400px]">
        <table className="w-full text-xs font-mono">
          <thead className="sticky top-0 bg-card">
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-2 px-2">Date</th>
              <th className="text-right py-2 px-2">Open</th>
              <th className="text-right py-2 px-2">High</th>
              <th className="text-right py-2 px-2">Low</th>
              <th className="text-right py-2 px-2">Close</th>
              <th className="text-right py-2 px-2">Volume</th>
              <th className="text-right py-2 px-2">RSI</th>
              <th className="text-center py-2 px-2">Signal</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((d, i) => {
              const prevClose = i < displayed.length - 1 ? displayed[i + 1].close : d.open;
              const isUp = d.close >= prevClose;
              return (
                <tr key={d.date} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-1.5 px-2 text-muted-foreground">{d.date}</td>
                  <td className="py-1.5 px-2 text-right">{d.open.toFixed(2)}</td>
                  <td className="py-1.5 px-2 text-right text-chart-green">{d.high.toFixed(2)}</td>
                  <td className="py-1.5 px-2 text-right text-chart-red">{d.low.toFixed(2)}</td>
                  <td className={`py-1.5 px-2 text-right font-bold ${isUp ? "text-chart-green" : "text-chart-red"}`}>
                    {d.close.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 text-right text-muted-foreground">
                    {d.volume ? (d.volume / 1e6).toFixed(1) + "M" : "-"}
                  </td>
                  <td className={`py-1.5 px-2 text-right ${
                    (d.rsi || 50) > 70 ? "text-chart-red" : (d.rsi || 50) < 30 ? "text-chart-green" : "text-muted-foreground"
                  }`}>
                    {(d.rsi || 50).toFixed(0)}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {d.signal === "BUY" ? (
                      <span className="inline-flex items-center gap-0.5 text-chart-green"><TrendingUp className="w-3 h-3" /> BUY</span>
                    ) : d.signal === "SELL" ? (
                      <span className="inline-flex items-center gap-0.5 text-chart-red"><TrendingDown className="w-3 h-3" /> SELL</span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-muted-foreground"><Minus className="w-3 h-3" /> HOLD</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PriceTable;
