import { Trade } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  trades: Trade[];
}

const TradeLog = ({ trades }: Props) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Trade Log (Virtual ₹10,000)</h3>
    <div className="max-h-[250px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-mono text-xs">Date</TableHead>
            <TableHead className="text-muted-foreground font-mono text-xs">Signal</TableHead>
            <TableHead className="text-muted-foreground font-mono text-xs">Price</TableHead>
            <TableHead className="text-muted-foreground font-mono text-xs">Qty</TableHead>
            <TableHead className="text-muted-foreground font-mono text-xs">P&L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((t, i) => (
            <TableRow key={i} className="border-border">
              <TableCell className="font-mono text-xs">{t.date}</TableCell>
              <TableCell>
                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${t.type === "BUY" ? "bg-buy text-buy" : "bg-sell text-sell"}`}>
                  {t.type}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs">₹{t.price.toFixed(2)}</TableCell>
              <TableCell className="font-mono text-xs">{t.quantity}</TableCell>
              <TableCell className={`font-mono text-xs font-bold ${t.pnl >= 0 ? "text-buy" : "text-sell"}`}>
                {t.pnl !== 0 ? `${t.pnl > 0 ? "+" : ""}₹${t.pnl.toFixed(2)}` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

export default TradeLog;
