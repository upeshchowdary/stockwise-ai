// Cloud backend — no MySQL dependency
// Deploys to Render.com for the GitHub Pages demo
// Only handles stock-search and stock-quote (Yahoo Finance proxy + prediction engine)

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Prediction Engine ─────────────────────────────────────────────────────────
function predictStock(data, symbol) {
    if (data.length < 2) return data;
    const hourSeed = Math.floor(Date.now() / 3600000);
    return data.map((d, i) => {
        const sw = 14, lw = 50;
        const sliceShort = data.slice(Math.max(0, i - sw), i + 1);
        const sliceLong = data.slice(Math.max(0, i - lw), i + 1);
        const support = Math.min(...sliceShort.map(s => s.low));
        const resistance = Math.max(...sliceShort.map(s => s.high));
        const sma14 = sliceShort.reduce((a, s) => a + s.close, 0) / sliceShort.length;
        const sma50 = sliceLong.reduce((a, s) => a + s.close, 0) / sliceLong.length;

        let rsi = 50;
        if (i >= 14) {
            let gains = 0, losses = 0;
            for (let j = i - 13; j <= i; j++) {
                const diff = data[j].close - data[j - 1].close;
                if (diff > 0) gains += diff; else losses -= diff;
            }
            const rs = losses === 0 ? 100 : gains / losses;
            rsi = 100 - (100 / (1 + rs));
        }

        const volatility = sliceShort.length > 1
            ? Math.sqrt(sliceShort.reduce((a, s) => a + Math.pow(s.close - sma14, 2), 0) / sliceShort.length) / sma14
            : 0;
        const momentum = i > 0 ? (d.close - data[i - 1].close) / data[i - 1].close : 0;

        let prob = 0.5;
        if (sma14 > sma50) prob += 0.05;
        if (d.close > sma14) prob += 0.05;
        if (rsi < 35) prob += 0.15;
        else if (rsi > 65) prob -= 0.15;
        const range = resistance - support;
        if (range > 0) {
            const pos = (d.close - support) / range;
            if (pos < 0.2) prob += 0.10;
            else if (pos > 0.8) prob -= 0.10;
        }
        // deterministic hourly jitter
        const seed = (symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * (i + 1) * (hourSeed + 1)) % 1000;
        prob += (seed / 1000 - 0.5) * 0.06;
        prob = Math.max(0.15, Math.min(0.85, prob));

        const signal = prob > 0.62 ? 'BUY' : prob < 0.38 ? 'SELL' : 'HOLD';
        return {
            ...d, rsi: +rsi.toFixed(2), sma14: +sma14.toFixed(2), sma50: +sma50.toFixed(2),
            support: +support.toFixed(2), resistance: +resistance.toFixed(2),
            volatility: +volatility.toFixed(4), momentum: +momentum.toFixed(4),
            signal, prediction: +prob.toFixed(4)
        };
    });
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.post('/api/stock-search', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ results: [] });
    try {
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0&listsCount=0`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!r.ok) throw new Error('Yahoo Search failed');
        const data = await r.json();
        const results = (data.quotes || [])
            .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
            .map(q => ({
                symbol: q.symbol, name: q.shortname || q.longname || q.symbol,
                exchange: q.exchDisp || q.exchange, type: q.quoteType
            }));
        res.json({ results });
    } catch (e) {
        res.status(500).json({ results: [], error: e.message });
    }
});

app.post('/api/stock-quote', async (req, res) => {
    const { symbol, range = '6mo', interval = '1d' } = req.body;
    if (!symbol) return res.status(400).json({ success: false, error: 'Symbol required' });
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
        if (!r.ok) throw new Error(`Yahoo Finance error: ${r.status}`);
        const json = await r.json();
        const chart = json?.chart?.result?.[0];
        if (!chart) throw new Error('No data returned');

        const timestamps = chart.timestamp || [];
        const q = chart.indicators.quote[0];
        const meta = chart.meta;
        const name = meta.longName || meta.shortName || symbol;

        const rawData = timestamps.map((t, i) => ({
            date: new Date(t * 1000).toISOString().split('T')[0],
            open: +(q.open[i] || 0).toFixed(2),
            high: +(q.high[i] || 0).toFixed(2),
            low: +(q.low[i] || 0).toFixed(2),
            close: +(q.close[i] || 0).toFixed(2),
            volume: q.volume[i] || 0,
        })).filter(d => d.close > 0);

        const currentPrice = meta.regularMarketPrice || rawData[rawData.length - 1]?.close || 0;
        const hourSeed = Math.floor(Date.now() / 3600000);
        const enriched = predictStock(rawData, symbol);

        res.json({
            success: true, data: enriched, name, currentPrice: +currentPrice.toFixed(2),
            source: 'Yahoo Finance', hourSeed
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Stub endpoints (no MySQL in cloud — return empty data gracefully)
app.get('/api/wallet', (_, res) => res.json({ balance: 1000000 }));
app.get('/api/portfolio', (_, res) => res.json([]));
app.get('/api/trades', (_, res) => res.json([]));
app.post('/api/trade', (_, res) => res.json({ success: false, error: 'Trading not available in demo mode' }));
app.post('/api/track-view', (_, res) => res.json({ success: true }));
app.get('/api/stock-views', (_, res) => res.json({ views: [], counts: [] }));
app.get('/api/watchlist', (_, res) => res.json([]));

app.listen(PORT, () => console.log(`Cloud backend running on port ${PORT}`));
