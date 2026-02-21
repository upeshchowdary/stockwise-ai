import { StockData } from "./prediction-engine.ts";

/**
 * Historical Data Repository
 * Provides fallback data for the top 20 companies and 
 * logic for simulating 6 months of historical candles.
 */

export function generateHistoricalData(symbol: string, days = 180): StockData[] {
    const symbolHash = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    let s = symbolHash;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    // Adjust base price based on known stock ranges
    let basePrice = 500 + rand() * 3000;
    if (symbol.includes("RELIANCE")) basePrice = 2400;
    if (symbol.includes("TCS")) basePrice = 3800;
    if (symbol.includes("TCS")) basePrice = 3800;
    if (symbol.includes("MRF")) basePrice = 120000;

    let price = basePrice;
    const data: StockData[] = [];

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));

        // Add some long-term drift based on the symbol hash to make it unique
        const drift = (symbolHash % 10 - 5) / 1000;
        const volatility = 0.02 + (rand() * 0.015);
        const change = (rand() - 0.5 + drift) * price * volatility;

        price = Math.max(price + change, 10);

        data.push({
            date: date.toISOString().split('T')[0],
            open: +(price - change * 0.4).toFixed(2),
            high: +(price * (1 + rand() * 0.015)).toFixed(2),
            low: +(price * (1 - rand() * 0.015)).toFixed(2),
            close: +price.toFixed(2),
            volume: Math.floor(1000000 + rand() * 5000000),
        });
    }

    return data;
}
