-- Persistent stock history for ML data set
CREATE TABLE public.stock_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol, date)
);

-- Enable RLS
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

-- Allow public access for demonstration purposes
CREATE POLICY "Public access stock_history" ON public.stock_history FOR ALL USING (true) WITH CHECK (true);
