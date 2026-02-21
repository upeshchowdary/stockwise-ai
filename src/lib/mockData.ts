// Simulated stock data and ML predictions

export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  support: number;
  resistance: number;
}

export interface Prediction {
  probability: number;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
}

export interface Trade {
  date: string;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  pnl: number;
}

export interface ModelMetrics {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: number[][];
}

export interface Feature {
  name: string;
  importance: number;
}

export const STOCKS = [
  { symbol: "RELIANCE", name: "Reliance Industries" },
  { symbol: "TCS", name: "Tata Consultancy Services" },
  { symbol: "INFY", name: "Infosys Limited" },
  { symbol: "HDFCBANK", name: "HDFC Bank" },
  { symbol: "ITC", name: "ITC Limited" },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateStockData(symbol: string, days = 90): StockData[] {
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);
  const basePrice = 1500 + rand() * 1500;
  const data: StockData[] = [];
  let price = basePrice;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    const change = (rand() - 0.48) * price * 0.025;
    price = Math.max(price + change, 100);
    const high = price * (1 + rand() * 0.02);
    const low = price * (1 - rand() * 0.02);
    const support = price * (1 - 0.03 - rand() * 0.02);
    const resistance = price * (1 + 0.03 + rand() * 0.02);

    data.push({
      date: date.toISOString().split("T")[0],
      open: +(price - change * 0.3).toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +price.toFixed(2),
      volume: Math.floor(500000 + rand() * 2000000),
      support: +support.toFixed(2),
      resistance: +resistance.toFixed(2),
    });
  }
  return data;
}

export function generatePrediction(symbol: string): Prediction {
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + Date.now() % 1000;
  const rand = seededRandom(seed);
  const prob = 0.3 + rand() * 0.5;
  return {
    probability: +prob.toFixed(3),
    signal: prob > 0.6 ? "BUY" : prob < 0.4 ? "SELL" : "HOLD",
    confidence: +(0.6 + rand() * 0.35).toFixed(3),
  };
}

export function generateTrades(data: StockData[]): { trades: Trade[]; portfolioHistory: { date: string; value: number }[] } {
  let capital = 10000;
  let holdings = 0;
  const trades: Trade[] = [];
  const portfolioHistory: { date: string; value: number }[] = [];
  const rand = seededRandom(42);

  for (let i = 5; i < data.length; i++) {
    const prob = 0.3 + rand() * 0.5;
    const d = data[i];

    if (prob > 0.6 && capital > d.close && holdings === 0) {
      const qty = Math.floor(capital / d.close);
      holdings = qty;
      capital -= qty * d.close;
      trades.push({ date: d.date, type: "BUY", price: d.close, quantity: qty, pnl: 0 });
    } else if (prob < 0.4 && holdings > 0) {
      const pnl = +(holdings * d.close - holdings * (trades[trades.length - 1]?.price || d.close)).toFixed(2);
      capital += holdings * d.close;
      trades.push({ date: d.date, type: "SELL", price: d.close, quantity: holdings, pnl });
      holdings = 0;
    }

    portfolioHistory.push({ date: d.date, value: +(capital + holdings * d.close).toFixed(2) });
  }

  return { trades, portfolioHistory };
}

export function getModelMetrics(): ModelMetrics[] {
  return [
    {
      name: "Logistic Regression",
      accuracy: 0.72,
      precision: 0.70,
      recall: 0.74,
      f1: 0.72,
      confusionMatrix: [[45, 18], [14, 53]],
    },
    {
      name: "Random Forest",
      accuracy: 0.81,
      precision: 0.79,
      recall: 0.83,
      f1: 0.81,
      confusionMatrix: [[52, 11], [10, 57]],
    },
  ];
}

export function getFeatureImportance(): Feature[] {
  return [
    { name: "distance_to_support", importance: 0.23 },
    { name: "distance_to_resistance", importance: 0.19 },
    { name: "volatility", importance: 0.16 },
    { name: "price_returns", importance: 0.14 },
    { name: "proximity_ratio", importance: 0.11 },
    { name: "RSI", importance: 0.09 },
    { name: "momentum", importance: 0.05 },
    { name: "volume_change", importance: 0.03 },
  ];
}
