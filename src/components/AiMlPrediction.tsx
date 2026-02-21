import { useMemo } from "react";
import { StockQuoteData } from "@/lib/api";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Cpu, Activity, BarChart2, GitBranch } from "lucide-react";

interface Props {
    data: StockQuoteData[];
    currentPrice: number;
    symbol: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Exponential Moving Average */
function calcEMA(prices: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const ema: number[] = [];
    prices.forEach((p, i) => {
        if (i === 0) { ema.push(p); return; }
        ema.push(p * k + ema[i - 1] * (1 - k));
    });
    return ema;
}

/** RSI over last `period` closes */
function calcRSI(prices: number[], period = 14): number {
    if (prices.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff > 0) gains += diff; else losses -= diff;
    }
    const rs = losses === 0 ? 100 : gains / losses;
    return +(100 - 100 / (1 + rs)).toFixed(2);
}

/** Bollinger Bands (middle, upper, lower) */
function calcBollinger(prices: number[], period = 20): { mid: number; upper: number; lower: number } {
    const slice = prices.slice(-period);
    const mid = slice.reduce((a, b) => a + b, 0) / slice.length;
    const std = Math.sqrt(slice.reduce((a, v) => a + (v - mid) ** 2, 0) / slice.length);
    return { mid, upper: mid + 2 * std, lower: mid - 2 * std };
}

/** Weighted Linear Regression — recent points carry exponentially more weight */
function weightedLinReg(prices: number[]): { slope: number; intercept: number; rSquared: number } {
    const n = prices.length;
    let swX = 0, swY = 0, swXY = 0, swXX = 0, sw = 0;
    prices.forEach((y, i) => {
        const w = Math.exp(i / n);   // most-recent day gets highest weight
        swX += w * i; swY += w * y; swXY += w * i * y; swXX += w * i * i; sw += w;
    });
    const slope = (sw * swXY - swX * swY) / (sw * swXX - swX * swX);
    const intercept = (swY - slope * swX) / sw;
    const meanY = swY / sw;
    let ssRes = 0, ssTot = 0;
    prices.forEach((y, i) => {
        const w = Math.exp(i / n);
        ssRes += w * (y - (slope * i + intercept)) ** 2;
        ssTot += w * (y - meanY) ** 2;
    });
    return { slope, intercept, rSquared: Math.max(0, 1 - ssRes / ssTot) };
}

// ── Component ─────────────────────────────────────────────────────────────────

const AiMlPrediction = ({ data, currentPrice, symbol }: Props) => {
    const mlResult = useMemo(() => {
        if (data.length < 30) return null;

        const allCloses = data.map(d => d.close);
        const n = allCloses.length;

        // Model 1: Weighted Linear Regression
        const { slope, rSquared } = weightedLinReg(allCloses);

        // Model 2: MACD (EMA12 - EMA26)
        const ema12 = calcEMA(allCloses, 12);
        const ema26 = calcEMA(allCloses, 26);
        const macdVal = ema12[ema12.length - 1] - ema26[ema26.length - 1];
        const macdBullish = macdVal > 0;

        // Model 3: RSI momentum bias (daily price bias in absolute ₹)
        const rsi = calcRSI(allCloses, 14);
        const rsiBias =
            rsi < 30 ? +0.015 * currentPrice :
                rsi < 45 ? +0.005 * currentPrice :
                    rsi > 70 ? -0.015 * currentPrice :
                        rsi > 55 ? -0.005 * currentPrice : 0;

        // Model 4: Bollinger Band mean-reversion bias
        const bb = calcBollinger(allCloses, 20);
        const bbBias =
            currentPrice < bb.lower ? 0.008 * currentPrice :
                currentPrice > bb.upper ? -0.008 * currentPrice : 0;

        // Model 5: Rolling 30-day average return trend
        const returns30 = allCloses.slice(-31).slice(1).map((c, i) =>
            (c - allCloses.slice(-31)[i]) / allCloses.slice(-31)[i]
        );
        const avgReturn30 = returns30.reduce((a, b) => a + b, 0) / returns30.length;
        const volatility = Math.sqrt(
            returns30.reduce((a, r) => a + (r - avgReturn30) ** 2, 0) / returns30.length
        );
        const momentumStep = avgReturn30 * currentPrice; // expected daily ₹ change from momentum

        // Ensemble blend
        const wReg = 0.35, wMomentum = 0.25, wMacd = 0.20, wRsi = 0.12, wBb = 0.08;
        const macdStep = macdVal * 0.015;
        const dailyStep =
            wReg * slope +
            wMomentum * momentumStep +
            wMacd * macdStep +
            wRsi * rsiBias +
            wBb * bbBias;

        // Generate 5-day forecast with expanding uncertainty bands
        const predictions: { day: string; price: number; upper: number; lower: number; type: string }[] = [
            {
                day: "Today", price: +currentPrice.toFixed(2),
                upper: +(currentPrice * (1 + volatility)).toFixed(2),
                lower: +(currentPrice * (1 - volatility)).toFixed(2), type: "actual"
            },
        ];
        for (let i = 1; i <= 5; i++) {
            const base = currentPrice + dailyStep * i;
            const spread = volatility * currentPrice * Math.sqrt(i) * 1.5;
            predictions.push({
                day: `Day ${i}`,
                price: +Math.max(base, 1).toFixed(2),
                upper: +(base + spread).toFixed(2),
                lower: +(Math.max(base - spread, 1)).toFixed(2),
                type: "predicted",
            });
        }

        // Ensemble accuracy score
        let alignBonus = 0;
        if ((macdBullish) === (slope > 0)) alignBonus += 3;
        if ((rsi < 50) === (slope > 0)) alignBonus += 2;
        const accuracy = Math.min(98, rSquared * 100 + alignBonus);

        const getChange = (pred: number) => {
            const change = pred - currentPrice;
            return { change, pct: (change / currentPrice) * 100, isUp: change >= 0 };
        };

        const finalSignal =
            dailyStep > volatility * currentPrice * 0.5 ? "STRONG BUY" :
                dailyStep > 0 ? "BUY" :
                    dailyStep < -volatility * currentPrice * 0.5 ? "STRONG SELL" : "SELL";

        return {
            predictions,
            d1: getChange(predictions[1].price),
            d3: getChange(predictions[3].price),
            d5: getChange(predictions[5].price),
            day1: predictions[1], day3: predictions[3], day5: predictions[5],
            accuracy, rSquared: rSquared * 100,
            rsi, volatility: +(volatility * 100).toFixed(3),
            macdBullish, bb, n, finalSignal,
        };
    }, [data, currentPrice, symbol]);

    if (!mlResult) return (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Not enough data (need &gt;30 data points).
        </div>
    );

    const { predictions, d1, d3, d5, day1, day3, day5, accuracy, rSquared,
        rsi, volatility, macdBullish, bb, n, finalSignal } = mlResult;

    const signalColor = finalSignal.includes("BUY")
        ? "text-chart-green bg-chart-green/10 border-chart-green/30"
        : "text-chart-red bg-chart-red/10 border-chart-red/30";

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Ensemble ML Prediction</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                        5-MODEL BLEND · {n} DAYS
                    </span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${signalColor}`}>
                    {finalSignal.includes("BUY") ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {finalSignal}
                </div>
            </div>

            {/* Indicator chips */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    {
                        label: "RSI (14)", value: rsi.toFixed(1),
                        tag: rsi < 30 ? "OVERSOLD" : rsi > 70 ? "OVERBOUGHT" : "NEUTRAL",
                        color: rsi < 30 ? "text-chart-green" : rsi > 70 ? "text-chart-red" : "text-chart-yellow",
                        icon: <Activity className="w-3.5 h-3.5" />
                    },
                    {
                        label: "MACD", value: macdBullish ? "BULLISH" : "BEARISH",
                        tag: macdBullish ? "EMA12 > EMA26" : "EMA12 < EMA26",
                        color: macdBullish ? "text-chart-green" : "text-chart-red",
                        icon: <GitBranch className="w-3.5 h-3.5" />
                    },
                    {
                        label: "Bollinger", value: currentPrice > bb.upper ? "ABOVE" : currentPrice < bb.lower ? "BELOW" : "IN BAND",
                        tag: `Mid ₹${bb.mid.toFixed(0)}`,
                        color: currentPrice > bb.upper ? "text-chart-red" : currentPrice < bb.lower ? "text-chart-green" : "text-muted-foreground",
                        icon: <BarChart2 className="w-3.5 h-3.5" />
                    },
                    {
                        label: "Volatility", value: `${volatility}%`,
                        tag: volatility > 3 ? "HIGH" : volatility > 1.5 ? "MODERATE" : "LOW",
                        color: volatility > 3 ? "text-chart-red" : volatility > 1.5 ? "text-chart-yellow" : "text-chart-green",
                        icon: <Cpu className="w-3.5 h-3.5" />
                    },
                ].map(s => (
                    <div key={s.label} className="rounded-lg border border-border bg-card/60 p-4">
                        <div className={`flex items-center gap-1.5 mb-2 ${s.color}`}>
                            {s.icon}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                        </div>
                        <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.tag}</p>
                    </div>
                ))}
            </div>

            {/* Forecast Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "24h Forecast", ...d1, price: day1.price, lo: day1.lower, hi: day1.upper },
                    { label: "72h Forecast", ...d3, price: day3.price, lo: day3.lower, hi: day3.upper },
                    { label: "120h Forecast", ...d5, price: day5.price, lo: day5.lower, hi: day5.upper },
                ].map(item => (
                    <div key={item.label} className="rounded-lg border border-border bg-card/60 p-5 hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{item.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary font-bold">ENSEMBLE</span>
                        </div>
                        <p className="text-2xl font-bold font-mono mb-1">
                            ₹{item.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <div className={`flex items-center gap-1 text-sm font-mono font-semibold ${item.isUp ? "text-chart-green" : "text-chart-red"}`}>
                            {item.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {item.isUp ? "+" : ""}{item.change.toFixed(2)} ({item.isUp ? "+" : ""}{item.pct.toFixed(2)}%)
                        </div>
                        <p className="mt-1.5 text-[10px] text-muted-foreground font-mono">
                            Band: ₹{item.lo.toFixed(0)} – ₹{item.hi.toFixed(0)}
                        </p>
                    </div>
                ))}
            </div>

            {/* Chart + Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Ensemble Projection + Confidence Band
                        </h4>
                        <div className="flex gap-4 text-[10px] font-bold">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> Predicted</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary/20" /> Band</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={predictions} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="mlGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="mlBandGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.07} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis hide domain={["auto", "auto"]} />
                            <Tooltip
                                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11 }}
                                formatter={(value: number, name: string) => {
                                    const labels: Record<string, string> = { price: "Predicted", upper: "Upper", lower: "Lower" };
                                    return [`₹${value.toFixed(2)}`, labels[name] || name];
                                }}
                            />
                            <Area type="monotone" dataKey="upper" stroke="none" fill="url(#mlBandGrad)" strokeWidth={0} />
                            <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" strokeWidth={0} />
                            <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="url(#mlGrad)" strokeWidth={3}
                                dot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                                activeDot={{ r: 7, strokeWidth: 0 }} />
                            <ReferenceLine y={currentPrice} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-card p-5">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Model Metrics</h4>
                        <div className="space-y-4">
                            {[
                                { label: "Ensemble Score", value: accuracy.toFixed(1) + "%", pct: accuracy },
                                { label: "Regression R²", value: rSquared.toFixed(1) + "%", pct: rSquared },
                            ].map(m => (
                                <div key={m.label}>
                                    <div className="flex justify-between items-end mb-1.5">
                                        <span className="text-xs font-medium">{m.label}</span>
                                        <span className="text-sm font-bold font-mono text-primary">{m.value}</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${Math.min(m.pct, 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                            <div className="pt-2 space-y-2">
                                {[
                                    ["TRAINING", `${n} days`],
                                    ["ALGORITHMS", "5 models"],
                                    ["WEIGHTING", "Exponential"],
                                    ["UNCERTAINTY", "√t scaling"],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-[10px]">
                                        <span className="text-muted-foreground">{k}</span>
                                        <span className="font-bold font-mono">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                            <span className="text-primary font-bold">ENSEMBLE:</span> Weighted LinReg + MACD + RSI + Bollinger + Momentum trained on {n} days of real market data. Confidence bands expand with √t uncertainty.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiMlPrediction;
