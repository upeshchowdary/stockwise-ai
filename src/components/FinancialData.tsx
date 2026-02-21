import { StockQuoteData } from "@/lib/api";

interface Props {
  data: StockQuoteData[];
  currentPrice: number;
}

const FinancialData = ({ data, currentPrice }: Props) => {
  if (data.length === 0) return null;

  const last = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : last;

  const support = last.support || 0;
  const resistance = last.resistance || 0;
  const distSupport = last.distSupport || 0;
  const distResistance = last.distResistance || 0;
  const volatility = last.volatility || 0;
  const momentum = last.momentum || 0;
  const rsi = last.rsi || 50;

  // Calculate returns
  const dayReturn = prev ? ((last.close - prev.close) / prev.close) * 100 : 0;
  const weekData = data.slice(-5);
  const weekReturn = weekData.length > 1 ? ((last.close - weekData[0].close) / weekData[0].close) * 100 : 0;
  const monthData = data.slice(-22);
  const monthReturn = monthData.length > 1 ? ((last.close - monthData[0].close) / monthData[0].close) * 100 : 0;

  const dayHigh = last.high;
  const dayLow = last.low;

  const sections = [
    {
      title: "Price Overview",
      items: [
        { label: "Current Price", value: `₹${currentPrice.toFixed(2)}` },
        { label: "Day High", value: `₹${dayHigh.toFixed(2)}`, color: "text-chart-green" },
        { label: "Day Low", value: `₹${dayLow.toFixed(2)}`, color: "text-chart-red" },
        { label: "Day Range", value: `₹${dayLow.toFixed(2)} – ₹${dayHigh.toFixed(2)}` },
      ],
    },
    {
      title: "Support & Resistance",
      items: [
        { label: "Support Level", value: `₹${support.toFixed(2)}` },
        { label: "Resistance Level", value: `₹${resistance.toFixed(2)}` },
        { label: "Distance to Support", value: `${(distSupport * 100).toFixed(2)}%` },
        { label: "Distance to Resistance", value: `${(distResistance * 100).toFixed(2)}%` },
      ],
    },
    {
      title: "Technical Indicators",
      items: [
        { label: "RSI (14)", value: rsi.toFixed(1), color: rsi > 70 ? "text-chart-red" : rsi < 30 ? "text-chart-green" : undefined },
        { label: "Volatility", value: `${(volatility * 100).toFixed(2)}%`, color: volatility > 0.05 ? "text-chart-red" : volatility > 0.02 ? "text-chart-yellow" : "text-chart-green" },
        { label: "Momentum", value: `${momentum > 0 ? "+" : ""}${(momentum * 100).toFixed(2)}%`, color: momentum > 0 ? "text-chart-green" : "text-chart-red" },
      ],
    },
    {
      title: "Returns",
      items: [
        { label: "1-Day Return", value: `${dayReturn >= 0 ? "+" : ""}${dayReturn.toFixed(2)}%`, color: dayReturn >= 0 ? "text-chart-green" : "text-chart-red" },
        { label: "1-Week Return", value: `${weekReturn >= 0 ? "+" : ""}${weekReturn.toFixed(2)}%`, color: weekReturn >= 0 ? "text-chart-green" : "text-chart-red" },
        { label: "1-Month Return", value: `${monthReturn >= 0 ? "+" : ""}${monthReturn.toFixed(2)}%`, color: monthReturn >= 0 ? "text-chart-green" : "text-chart-red" },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div key={section.title} className="rounded-lg border border-border bg-card">
            <div className="px-5 py-3 border-b border-border">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</h4>
            </div>
            <div className="divide-y divide-border">
              {section.items.map((item) => (
                <div key={item.label} className="flex justify-between items-center px-5 py-2.5">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-sm font-mono font-semibold ${item.color || "text-foreground"}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialData;
