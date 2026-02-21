import { useState, useEffect, useCallback, useRef } from "react";
import { Brain, Activity, Wifi, WifiOff, RefreshCw, TrendingUp, TrendingDown, Minus, BarChart3, Shield, Target, Zap, Clock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockSearch from "@/components/StockSearch";
import PriceChart from "@/components/PriceChart";
import FeatureImportanceChart from "@/components/FeatureImportanceChart";
import ModelComparison from "@/components/ModelComparison";
import LivePriceCard from "@/components/LivePriceCard";
import PredictionPanel from "@/components/PredictionPanel";
import RSIGauge from "@/components/RSIGauge";
import VolatilityMeter from "@/components/VolatilityMeter";
import PriceTable from "@/components/PriceTable";
import PriceAlerts, { PriceAlert } from "@/components/PriceAlerts";
import Watchlist from "@/components/Watchlist";
import FuturePrediction from "@/components/FuturePrediction";
import FinancialData from "@/components/FinancialData";
import GrowwButton from "@/components/GrowwButton";
import Sidebar from "@/components/Sidebar";
import { getStockQuote, trackStockView, getStockViews, StockQuoteData } from "@/lib/api";

import { ThemeToggle } from "@/components/ThemeToggle";
import AiMlPrediction from "@/components/AiMlPrediction";

const REFRESH_INTERVAL = 5000; // 5 seconds for even more responsive feel

const Index = () => {
  const { toast } = useToast();
  const [symbol, setSymbol] = useState("");
  const [stockName, setStockName] = useState("");
  const [stockData, setStockData] = useState<StockQuoteData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [prevPrice, setPrevPrice] = useState(0);
  const [source, setSource] = useState<"online" | "offline">("online");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stockViews, setStockViews] = useState<{
    views: { symbol: string; name: string; viewed_at: string }[];
    counts: { symbol: string; view_count: number }[];
  } | null>(null);

  const fetchStockViews = useCallback(async () => {
    try {
      const data = await getStockViews();
      setStockViews(data);
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => {
    fetchStockViews();
  }, [fetchStockViews]);

  const [hourSeed, setHourSeed] = useState<number | undefined>();

  // Check alerts against current price
  useEffect(() => {
    if (!currentPrice || !symbol) return;
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.symbol !== symbol || a.triggered) return a;
        const shouldTrigger =
          (a.direction === "above" && currentPrice >= a.targetPrice) ||
          (a.direction === "below" && currentPrice <= a.targetPrice);
        if (shouldTrigger) {
          toast({
            title: `🔔 Price Alert: ${a.symbol}`,
            description: `Price ${a.direction === "above" ? "crossed above" : "dropped below"} ₹${a.targetPrice.toFixed(2)} — now at ₹${currentPrice.toFixed(2)}`,
          });
          return { ...a, triggered: true };
        }
        return a;
      })
    );
  }, [currentPrice, symbol, toast]);

  const fetchStock = useCallback(async (sym: string, name: string, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await getStockQuote(sym);
      if (res.success && res.data.length > 0) {
        setStockData(res.data);
        const newPrice = res.currentPrice || res.data[res.data.length - 1].close;
        setPrevPrice((prev) => prev || newPrice);
        setCurrentPrice(newPrice);
        setSource(res.source);
        setStockName(res.name || name);
        setLastUpdated(new Date());
        setHourSeed(res.hourSeed);
        if (!isRefresh) {
          const lastD = res.data[res.data.length - 1];
          trackStockView(sym, res.name || name, +newPrice.toFixed(2), +lastD.high.toFixed(2), +lastD.low.toFixed(2));
          toast({ title: `Loaded ${sym}`, description: `Source: ${res.source} | ${res.data.length} data points` });
        }
      }
    } catch (e) {
      if (!isRefresh) {
        toast({
          title: "Error loading stock",
          description: e instanceof Error ? e.message : String(e),
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadStock = useCallback((sym: string, name: string) => {
    setSymbol(sym);
    setStockName(name);
    setPrevPrice(0);
    setHourSeed(undefined);
    fetchStock(sym, name); // trackStockView is called inside fetchStock after data loads
  }, [fetchStock]);

  // REMOVED: auto-load random stock on mount
  useEffect(() => {
    // We now start on an empty state (Explore view) unless redirected with a symbol
  }, []);

  const currentPriceRef = useRef(currentPrice);
  useEffect(() => {
    currentPriceRef.current = currentPrice;
  }, [currentPrice]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (symbol && autoRefresh) {
      intervalRef.current = setInterval(() => {
        setPrevPrice(currentPriceRef.current);
        fetchStock(symbol, stockName, true);
      }, REFRESH_INTERVAL);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [symbol, autoRefresh, stockName, fetchStock]);

  const handleAddAlert = (alert: Omit<PriceAlert, "id" | "triggered">) => {
    setAlerts((prev) => [...prev, { ...alert, id: crypto.randomUUID(), triggered: false }]);
    toast({ title: "Alert set", description: `Notify when ${alert.symbol} goes ${alert.direction} ₹${alert.targetPrice.toFixed(2)}` });
  };

  const handleRemoveAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const lastData = stockData[stockData.length - 1];
  const prediction = lastData
    ? {
      probability: lastData.prediction || 0.5,
      signal: (lastData.signal || "HOLD") as "BUY" | "SELL" | "HOLD",
      rsi: lastData.rsi || 50,
      volatility: lastData.volatility || 0,
      momentum: lastData.momentum || 0,
      support: lastData.support || 0,
      resistance: lastData.resistance || 0,
    }
    : null;

  const priceChange = prevPrice ? currentPrice - prevPrice : 0;
  const priceChangePct = prevPrice ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

  // Day high/low from latest data
  const dayHigh = lastData?.high || currentPrice;
  const dayLow = lastData?.low || currentPrice;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav — screener.in style */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight hidden sm:inline">Project Stock</span>
          </Link>

          <StockSearch onSelect={loadStock} />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors font-medium border ${autoRefresh
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-secondary text-muted-foreground border-border"
                  }`}
              >
                <RefreshCw className={`w-3 h-3 ${autoRefresh ? "animate-spin" : ""}`} style={autoRefresh ? { animationDuration: "3s" } : {}} />
                {autoRefresh ? "LIVE" : "PAUSED"}
              </button>
              {symbol && (
                <span className="flex items-center gap-1 text-muted-foreground font-mono">
                  {source === "online" ? <Wifi className="w-3 h-3 text-primary" /> : <WifiOff className="w-3 h-3" />}
                  {source.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-full">
        {/* Sidebar only appears when a stock is selected to follow Image 3 flow */}
        {symbol && <Sidebar onSelect={loadStock} currentSymbol={symbol} />}

        <main className="flex-1 min-w-0 px-4 py-5 overflow-x-hidden">
          {!symbol ? (
            /* Image 2 Explore Style View */
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Market Indices Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-border/60">
                {[
                  { name: "NIFTY 50", price: "25,571.25", change: "+116.90 (+0.46%)", isUp: true },
                  { name: "SENSEX", price: "82,814.71", change: "+316.57 (+0.38%)", isUp: true },
                  { name: "BANK NIFTY", price: "61,172.00", change: "+432.45 (+0.71%)", isUp: true },
                  { name: "FIN NIFTY", price: "28,210.60", change: "-12.40 (-0.04%)", isUp: false },
                ].map((idx) => (
                  <div key={idx.name} className="p-3 rounded-lg bg-card/50 border border-border hover:border-primary/20 transition-all cursor-default group">
                    <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-1">{idx.name}</p>
                    <p className="text-sm font-bold font-mono">{idx.price}</p>
                    <p className={`text-[11px] font-medium flex items-center gap-1 ${idx.isUp ? "text-chart-green" : "text-chart-red"}`}>
                      {idx.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {idx.change}
                    </p>
                  </div>
                ))}
              </div>

              {/* Main Explore Content */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-10">
                  {/* Recently Viewed / Major Stocks */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Most Traded Today
                      </h3>
                      <button className="text-xs text-primary font-semibold hover:underline">See more</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                      {[
                        { symbol: "RELIANCE.NS", name: "Reliance", color: "bg-blue-500", short: "RI" },
                        { symbol: "TCS.NS", name: "TCS", color: "bg-red-500", short: "TC" },
                        { symbol: "HDFCBANK.NS", name: "HDFC Bank", color: "bg-indigo-500", short: "HB" },
                        { symbol: "INFY.NS", name: "Infosys", color: "bg-blue-600", short: "IN" },
                        { symbol: "ICICIBANK.NS", name: "ICICI Bank", color: "bg-orange-500", short: "IC" },
                        { symbol: "ITC.NS", name: "ITC", color: "bg-yellow-600", short: "IT" },
                        { symbol: "TATAMOTORS.NS", name: "Tata Motors", color: "bg-blue-400", short: "TM" },
                        { symbol: "SBIN.NS", name: "SBI", color: "bg-blue-700", short: "SB" },
                      ].map((stock) => (
                        <button
                          key={stock.symbol}
                          onClick={() => loadStock(stock.symbol, stock.name)}
                          className="flex flex-col items-center justify-center p-6 rounded-xl border border-border bg-card/40 hover:bg-card hover:border-primary/40 hover:shadow-lg transition-all group"
                        >
                          <div className={`w-12 h-12 rounded-xl ${stock.color} flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            {stock.short}
                          </div>
                          <span className="font-bold text-sm text-foreground mb-1">{stock.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{stock.symbol}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Market Movers Section */}
                  <section>
                    <h3 className="text-lg font-bold mb-6">Top Movers</h3>
                    <div className="space-y-3">
                      {[
                        { name: "Suzlon Energy", sym: "SUZLON.NS", price: "44.46", change: "-0.79 (1.75%)", isUp: false },
                        { name: "Tata Motors", sym: "TATAMOTORS.NS", price: "921.40", change: "+12.30 (1.35%)", isUp: true },
                        { name: "Zomato", sym: "ZOMATO.NS", price: "242.10", change: "+4.15 (1.74%)", isUp: true },
                      ].map((mover) => (
                        <div key={mover.sym} className="flex items-center justify-between p-4 rounded-lg bg-card/30 border border-border/60 hover:border-primary/20 transition-all cursor-pointer" onClick={() => loadStock(mover.sym, mover.name)}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">
                              {mover.name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground">{mover.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{mover.sym}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm font-mono">₹{mover.price}</p>
                            <p className={`text-[11px] font-semibold ${mover.isUp ? "text-chart-green" : "text-chart-red"}`}>
                              {mover.isUp ? "+" : ""}{mover.change}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Recently Viewed — live from MySQL stock_views */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Recently Viewed
                        <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">MySQL Live</span>
                      </h3>
                      <button onClick={fetchStockViews} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Refresh
                      </button>
                    </div>

                    {!stockViews || stockViews.views.length === 0 ? (
                      <div className="rounded-xl border border-border bg-card/20 p-8 text-center text-muted-foreground text-sm">
                        <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No views recorded yet. Click any stock to start tracking.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Recent Click History */}
                        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
                          <div className="px-4 py-3 border-b border-border bg-card/50 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Clicks</p>
                          </div>
                          <div className="divide-y divide-border/40 max-h-60 overflow-y-auto">
                            {stockViews.views.map((v, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between px-4 py-2.5 hover:bg-card/60 transition-colors cursor-pointer group"
                                onClick={() => loadStock(v.symbol, v.name)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                    {v.name[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{v.name}</p>
                                    <p className="text-[10px] font-mono text-muted-foreground">{v.symbol}</p>
                                  </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  {new Date(v.viewed_at).toLocaleTimeString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Most Viewed Leaderboard */}
                        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
                          <div className="px-4 py-3 border-b border-border bg-card/50 flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Most Viewed</p>
                          </div>
                          <div className="divide-y divide-border/40">
                            {stockViews.counts.slice(0, 6).map((c, i) => {
                              const viewName = stockViews.views.find(v => v.symbol === c.symbol)?.name || c.symbol;
                              return (
                                <div
                                  key={c.symbol}
                                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-card/60 transition-colors cursor-pointer group"
                                  onClick={() => loadStock(c.symbol, viewName)}
                                >
                                  <span className={`text-xs font-bold w-5 shrink-0 ${i === 0 ? 'text-chart-yellow' : 'text-muted-foreground/50'}`}>#{i + 1}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{viewName}</p>
                                    <p className="text-[10px] font-mono text-muted-foreground">{c.symbol}</p>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs font-bold text-primary shrink-0">
                                    <Eye className="w-3 h-3" /> {c.view_count}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                {/* Products & Tools Sidebar */}
                <div className="space-y-6">
                  <div className="p-6 rounded-xl border border-primary/20 bg-primary/5">
                    <h4 className="font-bold text-sm mb-4">Products & Tools</h4>
                    <div className="space-y-4">
                      {[
                        { icon: Zap, label: "Intraday AI", count: "3 open" },
                        { icon: Shield, label: "Safe Bonds", count: "1 open" },
                        { icon: BarChart3, label: "ETF Screener", count: null },
                        { icon: Target, label: "Option Chain", count: "915" },
                      ].map((tool) => (
                        <div key={tool.label} className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <tool.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{tool.label}</span>
                          </div>
                          {tool.count && (
                            <span className="text-[10px] font-bold bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{tool.count}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-xl border border-border bg-card/20 text-center py-10">
                    <Minus className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-xs text-muted-foreground">You haven't invested yet</p>
                  </div>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-28 text-center flex-col gap-4">
              <div className="relative">
                <Activity className="w-12 h-12 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse duration-1000" />
              </div>
              <span className="text-sm font-medium text-muted-foreground tracking-wide">Syncing market intelligence for {symbol}...</span>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500">
              {/* Reset view button (Go back to Explore) */}
              <button
                onClick={() => setSymbol("")}
                className="text-xs text-primary hover:underline flex items-center gap-1 mb-2 font-semibold"
              >
                ← Back to Explore
              </button>

              {/* Stock Header with KPI strip */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold">{stockName}</h2>
                    <span className="text-sm font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">{symbol}</span>
                    {prediction && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${prediction.signal === "BUY" ? "bg-buy text-buy" : prediction.signal === "SELL" ? "bg-sell text-sell" : "bg-hold text-hold"
                        }`}>
                        {prediction.signal}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-2xl font-bold font-mono">₹{currentPrice.toFixed(2)}</span>
                    <span className={`font-mono font-semibold flex items-center gap-1 ${priceChange >= 0 ? "text-chart-green" : "text-chart-red"
                      }`}>
                      {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)} ({priceChangePct >= 0 ? "+" : ""}{priceChangePct.toFixed(2)}%)
                    </span>
                    {lastUpdated && (
                      <span className="text-xs text-muted-foreground">
                        {lastUpdated.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GrowwButton symbol={symbol} />
                </div>
              </div>

              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KPICard label="Day High" value={`₹${dayHigh.toFixed(2)}`} color="text-chart-green" icon={<TrendingUp className="w-3.5 h-3.5" />} />
                <KPICard label="Day Low" value={`₹${dayLow.toFixed(2)}`} color="text-chart-red" icon={<TrendingDown className="w-3.5 h-3.5" />} />
                <KPICard label="AI Confidence" value={prediction ? `${(prediction.probability * 100).toFixed(1)}%` : "—"} color="text-primary" icon={<Brain className="w-3.5 h-3.5" />} />
                <KPICard label="RSI (14)" value={prediction ? prediction.rsi.toFixed(1) : "—"} color={prediction && prediction.rsi > 70 ? "text-chart-red" : prediction && prediction.rsi < 30 ? "text-chart-green" : "text-chart-yellow"} icon={<Target className="w-3.5 h-3.5" />} />
                <KPICard label="Volatility" value={prediction ? `${(prediction.volatility * 100).toFixed(2)}%` : "—"} color={prediction && prediction.volatility > 0.05 ? "text-chart-red" : "text-chart-yellow"} icon={<Zap className="w-3.5 h-3.5" />} />
                <KPICard label="Signal" value={prediction?.signal || "—"} color={prediction?.signal === "BUY" ? "text-chart-green" : prediction?.signal === "SELL" ? "text-chart-red" : "text-chart-yellow"} icon={<BarChart3 className="w-3.5 h-3.5" />} />
              </div>

              {/* Tabbed Content — screener.in layout */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 gap-0">
                  {[
                    { value: "overview", label: "Overview" },
                    { value: "prediction", label: "AI Prediction" },
                    { value: "aiml", label: "Ai Ml prediction" },
                    { value: "financial", label: "Financial Data" },
                    { value: "charts", label: "Charts" },
                    { value: "portfolio", label: "Portfolio" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:text-primary"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                      <PriceChart data={stockData} />
                    </div>
                    <div className="space-y-4">
                      {prediction && (
                        <PredictionPanel
                          signal={prediction.signal}
                          probability={prediction.probability}
                          support={prediction.support}
                          resistance={prediction.resistance}
                          momentum={prediction.momentum}
                        />
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {prediction && <RSIGauge value={prediction.rsi} />}
                        {prediction && <VolatilityMeter value={prediction.volatility} />}
                      </div>
                    </div>
                  </div>
                  <PriceTable data={stockData} />
                </TabsContent>

                {/* AI PREDICTION TAB */}
                <TabsContent value="prediction" className="mt-5 space-y-5">
                  <FuturePrediction data={stockData} currentPrice={currentPrice} symbol={symbol} hourSeed={hourSeed} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <FeatureImportanceChart />
                    <ModelComparison />
                  </div>
                </TabsContent>

                {/* AI ML PREDICTION (REAL ML) TAB */}
                <TabsContent value="aiml" className="mt-5 space-y-5">
                  <AiMlPrediction data={stockData} currentPrice={currentPrice} symbol={symbol} />
                </TabsContent>

                {/* FINANCIAL DATA TAB */}
                <TabsContent value="financial" className="mt-5">
                  <FinancialData data={stockData} currentPrice={currentPrice} />
                </TabsContent>

                {/* CHARTS TAB */}
                <TabsContent value="charts" className="mt-5 space-y-5">
                  <PriceChart data={stockData} />
                  <PriceTable data={stockData} />
                </TabsContent>

                {/* PORTFOLIO TAB */}
                <TabsContent value="portfolio" className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                      <Watchlist
                        currentSymbol={symbol}
                        currentName={stockName}
                        onSelectStock={loadStock}
                      />
                    </div>
                    <PriceAlerts
                      symbol={symbol}
                      currentPrice={currentPrice}
                      alerts={alerts}
                      onAddAlert={handleAddAlert}
                      onRemoveAlert={handleRemoveAlert}
                    />
                  </div>
                  {/* Disclaimer */}
                  <div className="rounded-lg border border-border bg-secondary/30 p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      <p className="font-semibold text-foreground mb-1">Trading Disclaimer</p>
                      <p>Trading within this platform is simulated. Real trading happens externally via Groww. AI predictions are for educational purposes only and do not constitute financial advice.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <footer className="text-center py-4 mt-6 text-xs text-muted-foreground border-t border-border">
            <p>⚠️ Academic project — AI predictions are for educational purposes only.</p>
            <p className="mt-1">Hybrid AI-Based Stock Market Prediction</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

/* KPI Card component */
const KPICard = ({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) => (
  <div className="rounded-lg border border-border bg-card p-3.5">
    <div className="flex items-center gap-1.5 mb-1">
      <span className={color}>{icon}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
    </div>
    <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
  </div>
);

export default Index;
