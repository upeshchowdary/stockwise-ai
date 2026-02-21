export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface StockQuoteData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  support?: number;
  resistance?: number;
  rsi?: number;
  volatility?: number;
  distSupport?: number;
  distResistance?: number;
  momentum?: number;
  prediction?: number;
  signal?: string;
}

export interface StockQuoteResponse {
  success: boolean;
  data: StockQuoteData[];
  source: "online" | "offline";
  currency?: string;
  currentPrice?: number;
  name?: string;
  error?: string;
  hourSeed?: number;
}

import { simulateStockData, simulateSearchResults } from "./simulator";
import { enrichWithAiSignals } from "./predictions";

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  try {
    const response = await fetch(`${API_URL}/stock-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!response.ok) throw new Error();
    const data = await response.json();
    return data?.results || [];
  } catch (e) {
    // Fallback 1: Direct Yahoo Search via AllOrigins (CORS Proxy)
    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0&listsCount=0`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
      const res = await fetch(proxyUrl);
      const json = await res.json();
      const data = JSON.parse(json.contents);
      return (data.quotes || [])
        .filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          exchange: q.exchDisp || q.exchange,
          type: q.quoteType,
        }));
    } catch (err) {
      return simulateSearchResults(query);
    }
  }
}

export async function getStockQuote(symbol: string, range = "6mo"): Promise<StockQuoteResponse> {
  // Step 1: Try Primary Backend
  try {
    const response = await fetch(`${API_URL}/stock-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, range })
    });
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (data.success && data.data) {
      data.data = enrichWithAiSignals(data.data, symbol);
    }
    return data;
  } catch (e) {
    console.warn(`Backend unreachable, trying CORS proxy fallback for ${symbol}`);

    // Step 2: Try Direct Yahoo via AllOrigins (CORS Proxy)
    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d&includePrePost=false`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
      const res = await fetch(proxyUrl);
      const json = await res.json();
      const chartData = JSON.parse(json.contents);
      const chart = chartData?.chart?.result?.[0];

      if (!chart) throw new Error('No data via proxy');

      const timestamps = chart.timestamp || [];
      const q = chart.indicators.quote[0];
      const meta = chart.meta;

      const rawData = timestamps.map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString().split('T')[0],
        open: +(q.open[i] || 0).toFixed(2),
        high: +(q.high[i] || 0).toFixed(2),
        low: +(q.low[i] || 0).toFixed(2),
        close: +(q.close[i] || 0).toFixed(2),
        volume: q.volume[i] || 0,
      })).filter((d: any) => d.close > 0);

      const currentPrice = meta.regularMarketPrice || rawData[rawData.length - 1]?.close || 0;
      const enriched = enrichWithAiSignals(rawData, symbol);

      return {
        success: true,
        data: enriched,
        name: meta.longName || meta.shortName || symbol,
        currentPrice: +currentPrice.toFixed(2),
        source: "online",
        hourSeed: Math.floor(Date.now() / 3600000)
      };
    } catch (err) {
      console.warn(`CORS proxy failed, falling back to simulator for ${symbol}`);
      // Step 3: Absolute Last Resort - Simulator
      return simulateStockData(symbol);
    }
  }
}

export async function getWallet() {
  const response = await fetch(`${API_URL}/wallet`);
  if (!response.ok) throw new Error('Failed to fetch wallet');
  return await response.json();
}

export async function getPortfolio() {
  const response = await fetch(`${API_URL}/portfolio`);
  if (!response.ok) throw new Error('Failed to fetch portfolio');
  const data = await response.json();
  return data || [];
}

export async function getTrades() {
  const response = await fetch(`${API_URL}/trades`);
  if (!response.ok) throw new Error('Failed to fetch trades');
  const data = await response.json();
  return data || [];
}

export function trackStockView(
  symbol: string,
  name: string,
  currentPrice?: number,
  dayHigh?: number,
  dayLow?: number
): void {
  fetch(`${API_URL}/track-view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      symbol,
      name,
      current_price: currentPrice,
      day_high: dayHigh,
      day_low: dayLow,
    }),
  }).catch(() => { }); // fire-and-forget
}

export async function getStockViews(): Promise<{
  views: { symbol: string; name: string; viewed_at: string }[];
  counts: { symbol: string; view_count: number }[];
}> {
  const response = await fetch(`${API_URL}/stock-views`);
  if (!response.ok) throw new Error('Failed to fetch stock views');
  return await response.json();
}

export async function executeTrade(
  symbol: string,
  name: string,
  type: "BUY" | "SELL",
  price: number,
  quantity: number
) {
  const response = await fetch(`${API_URL}/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, name, type, price, quantity })
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || 'Trade failed');
  }
  return await response.json();
}
