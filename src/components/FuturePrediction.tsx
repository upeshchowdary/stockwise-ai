import { useMemo } from "react";
import { StockQuoteData } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, Minus, Brain } from "lucide-react";

interface Props {
  data: StockQuoteData[];
  currentPrice: number;
  symbol: string;
  hourSeed?: number;
}

// Simple seeded random generator
const seededRandom = (seed: number) => {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};

const FuturePrediction = ({ data, currentPrice, symbol, hourSeed }: Props) => {
  const predictionResult = useMemo(() => {
    if (data.length < 14) return null;

    const lastData = data[data.length - 1];
    const momentum = lastData.momentum || 0;
    const volatility = lastData.volatility || 0;
    const rsi = lastData.rsi || 50;

    // Compute prediction based on recent trend + indicators
    const recentReturns = data.slice(-10).map((d, i, arr) =>
      i > 0 ? (d.close - arr[i - 1].close) / arr[i - 1].close : 0
    ).slice(1);
    const avgReturn = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;

    // Bias factor from RSI
    const rsiBias = rsi < 30 ? 0.005 : rsi > 70 ? -0.005 : 0;
    const dailyDrift = avgReturn + rsiBias;

    // Seeded random for consistency (stable for 1 hour)
    const baseSeed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const finalSeed = hourSeed ? baseSeed + hourSeed : baseSeed + Math.floor(currentPrice);
    const rand = seededRandom(finalSeed);

    // Generate predictions
    const predictions: { day: string; price: number; type: string }[] = [
      { day: "Today", price: currentPrice, type: "actual" },
    ];
    let priceIter = currentPrice;
    const days = [1, 2, 3, 4, 5];
    for (const d of days) {
      priceIter = priceIter * (1 + dailyDrift + (rand() - 0.5) * volatility * 0.3);
      predictions.push({
        day: `Day ${d}`,
        price: +priceIter.toFixed(2),
        type: "predicted" as const,
      });
    }

    const day1 = predictions[1];
    const day3 = predictions[3];
    const day5 = predictions[5];

    const getChangeInfo = (pred: number) => {
      const change = pred - currentPrice;
      const pct = (change / currentPrice) * 100;
      return { change, pct, isUp: Math.abs(change) < 0.01 ? true : change >= 0 };
    };

    const d1 = getChangeInfo(day1.price);
    const d3 = getChangeInfo(day3.price);
    const d5 = getChangeInfo(day5.price);

    const confidence = lastData.prediction
      ? Math.max(40, Math.min(92, lastData.prediction * 100 + 10))
      : 65;

    return { predictions, d1, d3, d5, confidence, day1, day3, day5 };
  }, [data, currentPrice, symbol]);

  if (!predictionResult) return null;

  const { predictions, d1, d3, d5, confidence, day1, day3, day5 } = predictionResult;

  return (
    <div className="space-y-4">
      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Next Day", ...d1, price: day1.price },
          { label: "3-Day Forecast", ...d3, price: day3.price },
          { label: "5-Day Forecast", ...d5, price: day5.price },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{item.label}</span>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary">
                <Brain className="w-3 h-3" /> AI
              </span>
            </div>
            <p className="text-2xl font-bold font-mono mb-1">
              ₹{item.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center gap-1 text-sm font-mono font-semibold ${item.isUp ? "text-chart-green" : "text-chart-red"
              }`}>
              {item.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {item.isUp ? "+" : ""}{item.change.toFixed(2)} ({item.isUp ? "+" : ""}{item.pct.toFixed(2)}%)
            </div>
          </div>
        ))}
      </div>

      {/* Predicted Trend Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Predicted Price Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={predictions}>
            <defs>
              <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fill: "hsl(215, 15%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: "hsl(215, 15%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 13%, 90%)",
                borderRadius: 8,
                fontFamily: "JetBrains Mono",
                fontSize: 12,
              }}
              formatter={(value: number) => [`₹${value.toFixed(2)}`, "Price"]}
            />
            <Area type="monotone" dataKey="price" stroke="hsl(210, 100%, 50%)" fill="url(#predGrad)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(210, 100%, 50%)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Confidence */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Model Confidence Score</span>
          <span className="text-lg font-bold font-mono text-primary">{confidence.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div className="h-2 rounded-full bg-primary transition-all duration-700" style={{ width: `${confidence}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          ⚠️ AI prediction is based on technical analysis and historical patterns. This is not financial advice.
        </p>
      </div>
    </div>
  );
};

export default FuturePrediction;
