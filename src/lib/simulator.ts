import { StockQuoteData, StockQuoteResponse } from "./api";
import { enrichWithAiSignals } from "./predictions";

/**
 * High-Fidelity Stock Simulator
 * Generates realistic price action when the backend is unreachable.
 */
export function simulateStockData(symbol: string): StockQuoteResponse {
    const data: StockQuoteData[] = [];
    const now = new Date();

    // Baseline price based on symbol name
    let price = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 500 + 50;
    const volatility = 0.015; // 1.5% daily volatility

    for (let i = 180; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const change = price * volatility * (Math.random() - 0.48); // slight upward bias
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + (Math.random() * price * 0.01);
        const low = Math.min(open, close) - (Math.random() * price * 0.01);

        data.push({
            date: date.toISOString().split('T')[0],
            open: +open.toFixed(2),
            high: +high.toFixed(2),
            low: +low.toFixed(2),
            close: +close.toFixed(2),
            volume: Math.floor(Math.random() * 1000000) + 500000,
        });

        price = close;
    }

    const enriched = enrichWithAiSignals(data, symbol);

    return {
        success: true,
        data: enriched,
        source: "offline" as const,
        currentPrice: enriched[enriched.length - 1].close,
        name: symbol.split('.')[0],
        hourSeed: Math.floor(Date.now() / 3600000)
    };
}

export function simulateSearchResults(query: string) {
    const common = [
        { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "EQUITY" },
        { symbol: "RELIANCE.NS", name: "Reliance Industries", exchange: "NSE", type: "EQUITY" },
        { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", type: "EQUITY" },
        { symbol: "TCS.NS", name: "Tata Consultancy Services", exchange: "NSE", type: "EQUITY" },
        { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", type: "EQUITY" },
        { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", type: "EQUITY" },
    ];

    return common.filter(s =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    );
}
