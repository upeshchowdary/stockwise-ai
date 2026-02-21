import { StockQuoteData } from "@/lib/api";
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, CartesianGrid } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area } from "recharts";
import { useCallback } from "react";

interface Props {
  data: StockQuoteData[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: StockQuoteData & {
      fullDate: string;
      wickRange: [number, number];
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const isUp = d.close >= d.open;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs font-mono">
      <p className="text-muted-foreground mb-1.5">{d.fullDate || d.date}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-muted-foreground">Open</span><span>{d.open.toFixed(2)}</span>
        <span className="text-muted-foreground">High</span><span className="text-chart-green">{d.high.toFixed(2)}</span>
        <span className="text-muted-foreground">Low</span><span className="text-chart-red">{d.low.toFixed(2)}</span>
        <span className="text-muted-foreground">Close</span>
        <span className={isUp ? "text-chart-green font-bold" : "text-chart-red font-bold"}>{d.close.toFixed(2)}</span>
      </div>
      {d.signal && (
        <p className={`mt-1.5 font-bold ${d.signal === "BUY" ? "text-chart-green" : d.signal === "SELL" ? "text-chart-red" : "text-muted-foreground"}`}>
          Signal: {d.signal}
        </p>
      )}
    </div>
  );
};

interface CandlestickShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: StockQuoteData & {
    bodyTop: number;
    bodyBottom: number;
  };
}

// Candlestick rendered as two bars: one for the body range, wicks via error-bar-like approach
// We use a ComposedChart with a custom bar shape
const CandlestickShape = (props: CandlestickShapeProps) => {
  const { x, y, width, height, payload } = props;
  if (!payload || x === undefined || y === undefined || width === undefined || height === undefined) return null;

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const fill = isUp ? "hsl(142, 70%, 40%)" : "hsl(0, 72%, 51%)";

  // The bar is rendered for "high" dataKey, so y = top of chart area mapped to "high"
  // We need to calculate positions using the bar's coordinate system
  // props.y is the y position for the "high" value
  // props.background.height is the full chart area height
  // We can use the fact that the bar renders from y to y+height for the data range

  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y + height}
        stroke={fill}
        strokeWidth={1.5}
      />
      {/* Body */}
      <rect
        x={x + 1}
        y={y + (height * (high - Math.max(open, close)) / (high - low || 1))}
        width={Math.max(width - 2, 2)}
        height={Math.max(height * Math.abs(close - open) / (high - low || 1), 1)}
        fill={fill}
        rx={1}
      />
    </g>
  );
};

const PriceChart = ({ data }: Props) => {
  const chartData = data.map((d) => ({
    ...d,
    date: d.date.slice(5),
    fullDate: d.date,
    // Range for the wick (full candle from low to high)
    wickRange: [d.low, d.high],
  }));

  const allLows = data.map((d) => d.low);
  const allHighs = data.map((d) => d.high);
  const minPrice = Math.min(...allLows) * 0.998;
  const maxPrice = Math.max(...allHighs) * 1.002;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Tabs defaultValue="candlestick">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Price Chart</h3>
          <TabsList className="h-7">
            <TabsTrigger value="candlestick" className="text-xs px-2 py-0.5">Candlestick</TabsTrigger>
            <TabsTrigger value="area" className="text-xs px-2 py-0.5">Area</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="candlestick" className="mt-0">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: "hsl(215, 15%, 45%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[minPrice, maxPrice]} tick={{ fill: "hsl(215, 15%, 45%)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(0)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="wickRange" shape={<CandlestickShape />} isAnimationActive={false} />
              <Line type="monotone" dataKey="support" stroke="hsl(210, 100%, 50%)" strokeDasharray="4 4" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="resistance" stroke="hsl(0, 72%, 51%)" strokeDasharray="4 4" dot={false} strokeWidth={1} />
            </ComposedChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="area" className="mt-0">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 70%, 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 70%, 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: "hsl(215, 15%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "hsl(215, 15%, 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="close" stroke="hsl(142, 70%, 40%)" fill="url(#priceGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="support" stroke="hsl(210, 100%, 50%)" strokeDasharray="4 4" fill="none" strokeWidth={1} dot={false} />
              <Area type="monotone" dataKey="resistance" stroke="hsl(0, 72%, 51%)" strokeDasharray="4 4" fill="none" strokeWidth={1} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4 mt-2 text-xs font-mono text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" /> Price</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-chart-blue inline-block" /> Support</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-chart-red inline-block" /> Resistance</span>
      </div>
    </div>
  );
};

export default PriceChart;
