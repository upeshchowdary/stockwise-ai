import { StockQuoteData } from "./api";

/**
 * AI Prediction Engine (Ported from Backend)
 * Calculates indicators and buy/sell signals on the client side.
 */
export function enrichWithAiSignals(data: StockQuoteData[], symbol: string): StockQuoteData[] {
    if (data.length < 2) return data;

    const hourSeed = Math.floor(Date.now() / 3600000);

    return data.map((d, i) => {
        const sw = 14; // Short window
        const lw = 50; // Long window

        const sliceShort = data.slice(Math.max(0, i - sw), i + 1);
        const sliceLong = data.slice(Math.max(0, i - lw), i + 1);

        const support = Math.min(...sliceShort.map((s) => s.low));
        const resistance = Math.max(...sliceShort.map((s) => s.high));

        const sma14 = sliceShort.reduce((acc, s) => acc + s.close, 0) / sliceShort.length;
        const sma50 = sliceLong.reduce((acc, s) => acc + s.close, 0) / sliceLong.length;

        let rsi = 50;
        if (i >= 14) {
            let gains = 0, losses = 0;
            for (let j = i - 13; j <= i; j++) {
                const diff = data[j].close - data[j - 1].close;
                if (diff > 0) gains += diff;
                else losses -= diff;
            }
            const rs = losses === 0 ? 100 : gains / losses;
            rsi = 100 - 100 / (1 + rs);
        }

        const volatility =
            sliceShort.length > 1
                ? Math.sqrt(
                    sliceShort.reduce((acc, s) => acc + Math.pow(s.close - sma14, 2), 0) /
                    sliceShort.length
                ) / sma14
                : 0;

        const momentum = i > 0 ? (d.close - data[i - 1].close) / data[i - 1].close : 0;

        // AI Prediction Score (0.0 to 1.0)
        let prob = 0.5;
        if (sma14 > sma50) prob += 0.05;
        if (d.close > sma14) prob += 0.05;
        if (rsi < 35) prob += 0.15;
        else if (rsi > 65) prob -= 0.15;

        const range = resistance - support;
        if (range > 0) {
            const pos = (d.close - support) / range;
            if (pos < 0.2) prob += 0.1;
            else if (pos > 0.8) prob -= 0.1;
        }

        // Deterministic jitter based on symbol and hour
        const seedStr = symbol + i + hourSeed;
        let seedValue = 0;
        for (let k = 0; k < seedStr.length; k++) seedValue += seedStr.charCodeAt(k);
        prob += ((seedValue % 100) / 1000) - 0.05;

        prob = Math.max(0.15, Math.min(0.85, prob));

        const signal = prob > 0.62 ? "BUY" : prob < 0.38 ? "SELL" : "HOLD";

        return {
            ...d,
            rsi: +rsi.toFixed(2),
            sma14: +sma14.toFixed(2),
            sma50: +sma50.toFixed(2),
            support: +support.toFixed(2),
            resistance: +resistance.toFixed(2),
            volatility: +volatility.toFixed(4),
            momentum: +momentum.toFixed(4),
            signal,
            prediction: +prob.toFixed(4),
        };
    });
}
