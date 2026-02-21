import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchStocks, StockSearchResult } from "@/lib/api";

interface Props {
  onSelect: (symbol: string, name: string) => void;
}

const StockSearch = ({ onSelect }: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await searchStocks(query);
        setResults(r);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search any stock (AAPL, Reliance, Tesla...)"
          className="pl-9 pr-8 bg-card border-border font-mono text-sm"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-[300px] overflow-auto">
          {results.map((r) => (
            <button
              key={r.symbol}
              onClick={() => { onSelect(r.symbol, r.name); setQuery(""); setIsOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors flex items-center justify-between"
            >
              <div>
                <span className="font-mono font-bold text-sm text-foreground">{r.symbol}</span>
                <span className="ml-2 text-xs text-muted-foreground">{r.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{r.exchange}</span>
            </button>
          ))}
        </div>
      )}
      {isOpen && loading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-3 text-xs text-muted-foreground text-center">
          Searching...
        </div>
      )}
    </div>
  );
};

export default StockSearch;
