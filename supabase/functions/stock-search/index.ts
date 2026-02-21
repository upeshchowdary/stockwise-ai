const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface YahooQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  exchDisp?: string;
  quoteType: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.length < 1) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Yahoo Finance autosuggest API
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0&listsCount=0&enableFuzzyQuery=false`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      // Fallback: return some common Indian stocks matching the query
      const fallbackStocks = [
        { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE', type: 'Equity' },
        { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', type: 'Equity' },
        { symbol: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', type: 'Equity' },
        { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', exchange: 'NSE', type: 'Equity' },
        { symbol: 'ITC.NS', name: 'ITC Limited', exchange: 'NSE', type: 'Equity' },
        { symbol: 'WIPRO.NS', name: 'Wipro Limited', exchange: 'NSE', type: 'Equity' },
        { symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', type: 'Equity' },
        { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', exchange: 'NSE', type: 'Equity' },
        { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', exchange: 'NSE', type: 'Equity' },
        { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'Equity' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'Equity' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'Equity' },
        { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', type: 'Equity' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', type: 'Equity' },
        { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', type: 'Equity' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'Equity' },
      ];

      const q = query.toLowerCase();
      const filtered = fallbackStocks.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );

      return new Response(
        JSON.stringify({ results: filtered }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const results = (data.quotes as YahooQuote[] || [])
      .filter((q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .map((q) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchDisp || q.exchange,
        type: q.quoteType,
      }));

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ results: [], error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
