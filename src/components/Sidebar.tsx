import { Building2, Search } from "lucide-react";
import { useState } from "react";

const COMPANIES = [
    { symbol: "RELIANCE.NS", name: "Reliance Industries" },
    { symbol: "TCS.NS", name: "Tata Consultancy Services" },
    { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
    { symbol: "INFY.NS", name: "Infosys" },
    { symbol: "ICICIBANK.NS", name: "ICICI Bank" },
    { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever" },
    { symbol: "ITC.NS", name: "ITC" },
    { symbol: "SBIN.NS", name: "State Bank of India" },
    { symbol: "BHARTIARTL.NS", name: "Bharti Airtel" },
    { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank" },
    { symbol: "LT.NS", name: "Larsen & Toubro" },
    { symbol: "AXISBANK.NS", name: "Axis Bank" },
    { symbol: "ASIANPAINT.NS", name: "Asian Paints" },
    { symbol: "MARUTI.NS", name: "Maruti Suzuki" },
    { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical" },
    { symbol: "TITAN.NS", name: "Titan Company" },
    { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement" },
    { symbol: "BAJFINANCE.NS", name: "Bajaj Finance" },
    { symbol: "M&M.NS", name: "Mahindra & Mahindra" },
    { symbol: "NTPC.NS", name: "NTPC" },
];

interface SidebarProps {
    onSelect: (symbol: string, name: string) => void;
    currentSymbol?: string;
}

const Sidebar = ({ onSelect, currentSymbol }: SidebarProps) => {
    const [search, setSearch] = useState("");

    const filtered = COMPANIES.filter(
        (c) =>
            c.symbol.toLowerCase().includes(search.toLowerCase()) ||
            c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <aside className="w-64 border-r border-border bg-card overflow-y-auto hidden lg:block shrink-0 h-[calc(100vh-57px)] sticky top-[57px]">
            <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Quick access..."
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <nav className="p-2 space-y-1">
                {filtered.map((c) => (
                    <button
                        key={c.symbol}
                        onClick={() => onSelect(c.symbol, c.name)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${currentSymbol === c.symbol
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                    >
                        <Building2 className="w-4 h-4 shrink-0" />
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className="truncate w-full">{c.name}</span>
                            <span className="text-[10px] opacity-70 font-mono truncate w-full">{c.symbol}</span>
                        </div>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
