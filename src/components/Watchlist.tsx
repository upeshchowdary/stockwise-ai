import { useState, useEffect } from "react";
import { Star, Plus, Trash2, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStockQuote } from "@/lib/api";

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

interface WatchlistItem {
  id: number;
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  signal?: string;
}

interface WatchlistProps {
  currentSymbol: string;
  currentName: string;
  onSelectStock: (symbol: string, name: string) => void;
}

const Watchlist = ({ currentSymbol, currentName, onSelectStock }: WatchlistProps) => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWatchlist = async () => {
    try {
      const response = await fetch(`${API_URL}/watchlist`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPrices = async (list: WatchlistItem[]) => {
    if (list.length === 0) return;
    setRefreshing(true);
    const updated = await Promise.all(
      list.map(async (item) => {
        try {
          const res = await getStockQuote(item.symbol, "5d");
          if (res.success && res.data.length >= 2) {
            const last = res.data[res.data.length - 1];
            const prev = res.data[res.data.length - 2];
            const change = ((last.close - prev.close) / prev.close) * 100;
            return { ...item, price: res.currentPrice || last.close, change, signal: last.signal };
          }
        } catch { }
        return item;
      })
    );
    setItems(updated);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  useEffect(() => {
    if (!loading && items.length > 0 && !items[0].price) {
      refreshPrices(items);
    }
  }, [loading]);

  const isInWatchlist = items.some((i) => i.symbol === currentSymbol);

  const addToWatchlist = async () => {
    if (!currentSymbol || isInWatchlist) return;
    try {
      const response = await fetch(`${API_URL}/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: currentSymbol, name: currentName })
      });
      if (response.ok) {
        const newItem = await response.json();
        setItems((prev) => [...prev, newItem]);
        refreshPrices([...items, newItem]);
      }
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    }
  };

  const removeFromWatchlist = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/watchlist/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-chart-yellow" style={{ color: "hsl(var(--chart-yellow))" }} />
            Watchlist
          </CardTitle>
          {currentSymbol && (
            <Button
              size="sm"
              variant={isInWatchlist ? "secondary" : "outline"}
              className="h-7 text-xs gap-1"
              onClick={addToWatchlist}
              disabled={isInWatchlist}
            >
              {isInWatchlist ? (
                <>
                  <Star className="w-3 h-3 fill-current" /> Saved
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" /> Add {currentSymbol}
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No stocks saved. Search and add stocks to your watchlist.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-secondary ${item.symbol === currentSymbol ? "bg-primary/5 border border-primary/20" : ""
                }`}
              onClick={() => onSelectStock(item.symbol, item.name)}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold font-mono truncate">{item.symbol}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.name}</p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {refreshing && !item.price ? (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                ) : item.price ? (
                  <div className="text-right">
                    <p className="text-xs font-mono font-semibold">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-0.5 justify-end">
                      {item.change !== undefined && (
                        <>
                          {item.change >= 0 ? (
                            <TrendingUp className="w-2.5 h-2.5" style={{ color: "hsl(var(--chart-green))" }} />
                          ) : (
                            <TrendingDown className="w-2.5 h-2.5" style={{ color: "hsl(var(--chart-red))" }} />
                          )}
                          <span
                            className="text-[10px] font-mono"
                            style={{
                              color: item.change >= 0 ? "hsl(var(--chart-green))" : "hsl(var(--chart-red))",
                            }}
                          >
                            {item.change >= 0 ? "+" : ""}
                            {item.change.toFixed(2)}%
                          </span>
                        </>
                      )}
                      {item.signal && (
                        <span
                          className={`text-[9px] font-bold ml-1 px-1 rounded ${item.signal === "BUY"
                              ? "bg-buy text-buy"
                              : item.signal === "SELL"
                                ? "bg-sell text-sell"
                                : "bg-hold text-hold"
                            }`}
                        >
                          {item.signal}
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}
                <button
                  className="text-muted-foreground hover:text-destructive ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWatchlist(item.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default Watchlist;
