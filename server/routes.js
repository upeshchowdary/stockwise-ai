import express from 'express';
import pool from './db.js';
import fetch from 'node-fetch';

export const router = express.Router();

// --- Stock API Proxies (replacing Supabase Functions) ---

router.post('/stock-search', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ results: [] });

    try {
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0&listsCount=0&enableFuzzyQuery=false`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) throw new Error('Yahoo Search Failed');
        const data = await response.json();
        const results = (data.quotes || [])
            .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
            .map(q => ({
                symbol: q.symbol,
                name: q.shortname || q.longname || q.symbol,
                exchange: q.exchDisp || q.exchange,
                type: q.quoteType,
            }));
        res.json({ results });
    } catch (error) {
        res.status(500).json({ results: [], error: error.message });
    }
});

/**
 * Advanced Prediction Engine
 * Calculates indicators and signals stable for 1 hour.
 */
function predictStock(data, symbol) {
    if (data.length < 2) return data;

    const hourSeed = Math.floor(Date.now() / 3600000);

    return data.map((d, i) => {
        const shortWindow = 14;
        const longWindow = 50;

        const startShort = Math.max(0, i - shortWindow);
        const sliceShort = data.slice(startShort, i + 1);

        const startLong = Math.max(0, i - longWindow);
        const sliceLong = data.slice(startLong, i + 1);

        const support = Math.min(...sliceShort.map(s => s.low));
        const resistance = Math.max(...sliceShort.map(s => s.high));

        const sma14 = sliceShort.reduce((acc, s) => acc + s.close, 0) / sliceShort.length;
        const sma50 = sliceLong.reduce((acc, s) => acc + s.close, 0) / sliceLong.length;

        let rsi = 50;
        if (i >= 14) {
            let gains = 0, losses = 0;
            for (let j = i - 13; j <= i; j++) {
                const change = data[j].close - data[j - 1].close;
                if (change > 0) gains += change;
                else losses -= change;
            }
            const avgGain = gains / 14;
            const avgLoss = losses / 14;
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            rsi = +(100 - 100 / (1 + rs)).toFixed(2);
        }

        const closes = sliceShort.map(s => s.close);
        const returns = closes.slice(1).map((c, idx) => (c - closes[idx]) / closes[idx]);
        const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const volatility = returns.length > 0
            ? +Math.sqrt(returns.reduce((a, r) => a + (r - meanReturn) ** 2, 0) / returns.length).toFixed(4)
            : 0;

        const momentum = i > 0 ? (d.close - data[i - 1].close) / data[i - 1].close : 0;

        let baseProb = 0.5;
        if (sma14 > sma50) baseProb += 0.05;
        if (d.close > sma14) baseProb += 0.05;
        if (rsi < 35) baseProb += 0.15;
        if (rsi > 65) baseProb -= 0.15;

        const distSupport = (d.close - support) / d.close;
        const distResistance = (resistance - d.close) / d.close;
        if (distSupport < 0.015) baseProb += 0.1;
        if (distResistance < 0.015) baseProb -= 0.1;

        const symbolHash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hourlyJitter = (((symbolHash + hourSeed) * 16807) % 2147483647) / 2147483647;

        let prob = (baseProb * 0.7) + (hourlyJitter * 0.3);
        prob = Math.max(0.12, Math.min(0.88, prob));

        return {
            ...d,
            support: +support.toFixed(2),
            resistance: +resistance.toFixed(2),
            rsi,
            volatility,
            distSupport: +distSupport.toFixed(4),
            distResistance: +distResistance.toFixed(4),
            momentum: +momentum.toFixed(4),
            prediction: +prob.toFixed(3),
            signal: prob > 0.62 ? 'BUY' : prob < 0.38 ? 'SELL' : 'HOLD',
        };
    });
}

router.post('/stock-quote', async (req, res) => {
    const { symbol, range = '6mo', interval = '1d' } = req.body;
    if (!symbol) return res.status(400).json({ success: false, error: 'Symbol required' });

    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) throw new Error('Yahoo Quote Failed');

        const json = await response.json();
        const result = json.chart?.result?.[0];
        if (!result || !result.timestamp) throw new Error('No price data');

        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];
        const currency = result.meta?.currency || 'INR';
        const currentPrice = result.meta?.regularMarketPrice || quote.close[quote.close.length - 1];
        const shortName = result.meta?.shortName || result.meta?.symbol || symbol;

        const stockData = timestamps.map((ts, i) => ({
            date: new Date(ts * 1000).toISOString().split('T')[0],
            open: +(quote.open[i] || 0).toFixed(2),
            high: +(quote.high[i] || 0).toFixed(2),
            low: +(quote.low[i] || 0).toFixed(2),
            close: +(quote.close[i] || 0).toFixed(2),
            volume: quote.volume[i] || 0,
        })).filter(d => d.close > 0);

        const enriched = predictStock(stockData, symbol);

        // Persist raw OHLCV data to MySQL stock_history (upsert style)
        try {
            const insertPromises = stockData.map(d =>
                pool.query(
                    `INSERT INTO stock_history (symbol, name, date, open, high, low, close, volume)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                       name = VALUES(name),
                       open = VALUES(open),
                       high = VALUES(high),
                       low = VALUES(low),
                       close = VALUES(close),
                       volume = VALUES(volume)`,
                    [symbol, shortName, d.date, d.open, d.high, d.low, d.close, d.volume]
                ).catch(() => { }) // silently ignore per-row errors
            );
            await Promise.all(insertPromises);
        } catch (dbErr) {
            console.error('Stock history persistence failed:', dbErr.message);
        }

        res.json({
            success: true,
            data: enriched,
            source: 'online',
            currency,
            currentPrice: +currentPrice.toFixed(2),
            name: shortName,
            hourSeed: Math.floor(Date.now() / 3600000)
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Database Routes (replacing Supabase Tables) ---

router.get('/stock-views', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT symbol, name, viewed_at
             FROM stock_views
             ORDER BY viewed_at DESC
             LIMIT 50`
        );
        // Also get view counts per symbol
        const [counts] = await pool.query(
            `SELECT symbol, COUNT(*) as view_count
             FROM stock_views
             GROUP BY symbol
             ORDER BY view_count DESC`
        );
        res.json({ views: rows, counts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/wallet', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM wallet LIMIT 1');
        if (rows.length === 0) {
            // Initialize wallet if empty
            const [result] = await pool.query('INSERT INTO wallet (balance) VALUES (1000000)');
            const [newRows] = await pool.query('SELECT * FROM wallet WHERE id = ?', [result.insertId]);
            return res.json(newRows[0]);
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/portfolio', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM portfolio');
        res.json(rows || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/trades', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM trades ORDER BY created_at DESC LIMIT 50');
        res.json(rows || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/track-view', async (req, res) => {
    const { symbol, name, current_price, day_high, day_low } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });
    try {
        await pool.query(
            'INSERT INTO stock_views (symbol, name, current_price, day_high, day_low) VALUES (?, ?, ?, ?, ?)',
            [symbol, name || symbol, current_price || null, day_high || null, day_low || null]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/trade', async (req, res) => {
    const { symbol, name, type, price, quantity } = req.body;
    const total = price * quantity;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [wallets] = await connection.query('SELECT * FROM wallet LIMIT 1');
        const wallet = wallets[0];

        if (type === 'BUY') {
            if (wallet.balance < total) throw new Error('Insufficient balance');
            await connection.query('UPDATE wallet SET balance = balance - ? WHERE id = ?', [total, wallet.id]);

            const [existing] = await connection.query('SELECT * FROM portfolio WHERE symbol = ?', [symbol]);
            if (existing.length > 0) {
                const item = existing[0];
                const newQty = item.quantity + quantity;
                const newAvg = (item.avg_buy_price * item.quantity + total) / newQty;
                await connection.query('UPDATE portfolio SET quantity = ?, avg_buy_price = ? WHERE id = ?', [newQty, newAvg, item.id]);
            } else {
                await connection.query('INSERT INTO portfolio (symbol, name, quantity, avg_buy_price) VALUES (?, ?, ?, ?)', [symbol, name, quantity, price]);
            }
        } else {
            // SELL
            const [existing] = await connection.query('SELECT * FROM portfolio WHERE symbol = ?', [symbol]);
            if (existing.length === 0 || existing[0].quantity < quantity) throw new Error('Insufficient holdings');

            const item = existing[0];
            await connection.query('UPDATE wallet SET balance = balance + ? WHERE id = ?', [total, wallet.id]);

            const newQty = item.quantity - quantity;
            if (newQty === 0) {
                await connection.query('DELETE FROM portfolio WHERE id = ?', [item.id]);
            } else {
                await connection.query('UPDATE portfolio SET quantity = ? WHERE id = ?', [newQty, item.id]);
            }
        }

        await connection.query('INSERT INTO trades (symbol, name, type, price, quantity, total) VALUES (?, ?, ?, ?, ?, ?)', [symbol, name, type, price, quantity, total]);

        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
});
