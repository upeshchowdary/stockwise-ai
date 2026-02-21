import { STOCKS } from "@/lib/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  selected: string;
  onSelect: (s: string) => void;
}

const StockSelector = ({ selected, onSelect }: Props) => (
  <Select value={selected} onValueChange={onSelect}>
    <SelectTrigger className="w-[240px] bg-card border-border font-mono">
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="bg-popover border-border">
      {STOCKS.map((s) => (
        <SelectItem key={s.symbol} value={s.symbol} className="font-mono">
          {s.symbol} — {s.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default StockSelector;
