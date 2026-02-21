/// <reference lib="deno.ns" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { predictStock, StockData } from "./prediction-engine.ts";
import { generateHistoricalData } from "./historical-data.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, range = '6mo', interval = '1d' } = await req.json();

    if (!symbol) {
      return new Response(
        JSON.stringify({ success: false, error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client safely
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    // Hour seed for stable predictions
    const hourSeed = Math.floor(Date.now() / 3600000);

    let stockData: StockData[];
    let source: 'online' | 'offline' = 'online';
    let currency = 'INR';
    let currentPrice = 0;
    let shortName = symbol;

    try {
      // Fetch from Yahoo Finance chart API
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
      console.log(`Fetching: ${url}`);

      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      if (!response.ok) {
        throw new Error(`Yahoo failed: ${response.status}`);
      }

      const json = await response.json();
      const result = json.chart?.result?.[0];

      if (!result || !result.timestamp) {
        throw new Error('No price data in response');
      }

      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];
      currency = result.meta?.currency || 'INR';
      currentPrice = result.meta?.regularMarketPrice || quote.close[quote.close.length - 1];
      shortName = result.meta?.shortName || result.meta?.symbol || symbol;

      stockData = timestamps.map((ts: number, i: number) => {
        const close = quote.close[i] || 0;
        const open = quote.open[i] || close;
        const high = quote.high[i] || close;
        const low = quote.low[i] || close;
        const volume = quote.volume[i] || 0;

        return {
          date: new Date(ts * 1000).toISOString().split('T')[0],
          open: +open.toFixed(2),
          high: +high.toFixed(2),
          low: +low.toFixed(2),
          close: +close.toFixed(2),
          volume,
        };
      }).filter((d: StockData) => d.close > 0);
    } catch (fetchErr: any) {
      console.warn(`Fetch failed for ${symbol}:`, fetchErr.message);
      stockData = generateHistoricalData(symbol, 180);
      source = 'offline';
      currentPrice = stockData[stockData.length - 1].close;
    }

    // Calculate technical indicators and AI signals
    const enriched = predictStock(stockData, symbol);

    // PERSISTENCE: Save to database for long-term ML dataset
    if (source === 'online' && stockData.length > 0 && supabase) {
      try {
        const formattedForDb = stockData.map(d => ({
          symbol,
          date: d.date,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
        }));

        const { error: upsertError } = await supabase
          .from('stock_history')
          .upsert(formattedForDb, { onConflict: 'symbol,date' });

        if (upsertError) console.error('Upsert failed:', upsertError);
      } catch (dbErr: any) {
        console.error('DB Persistence failed:', dbErr.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: enriched,
        source,
        currency,
        currentPrice: +currentPrice.toFixed(2),
        name: shortName,
        hourSeed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (outerError: any) {
    console.error('Critical Function Error:', outerError);
    return new Response(
      JSON.stringify({
        success: false,
        error: outerError.message || String(outerError),
        stack: outerError.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
