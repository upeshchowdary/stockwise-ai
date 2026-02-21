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
    return simulateSearchResults(query);
  }
}

export async function getStockQuote(symbol: string, range = "6mo"): Promise<StockQuoteResponse> {
  try {
    const response = await fetch(`${API_URL}/stock-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, range })
    });
    if (!response.ok) throw new Error();
    const data = await response.json();

    // Ensure data is enriched with signals even if backend didn't do it
    if (data.success && data.data) {
      data.data = enrichWithAiSignals(data.data, symbol);
    }

    return data;
  } catch (e) {
    console.warn(`Backend unreachable at ${API_URL}, falling back to simulator for ${symbol}`);
    return simulateStockData(symbol);
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
