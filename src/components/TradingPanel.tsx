import { useState, useEffect } from "react";
import { ShoppingCart, Wallet, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { executeTrade, getWallet } from "@/lib/api";

interface TradingPanelProps {
    symbol: string;
    name: string;
    currentPrice: number;
    onTradeComplete: () => void;
}

const TradingPanel = ({ symbol, name, currentPrice, onTradeComplete }: TradingPanelProps) => {
    const { toast } = useToast();
    const [quantity, setQuantity] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);

    const fetchBalance = async () => {
        try {
            const wallet = await getWallet();
            setBalance(wallet.balance);
        } catch (error) {
            console.error("Failed to fetch balance:", error);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, [symbol]);

    const handleTrade = async (type: "BUY" | "SELL") => {
        if (quantity <= 0) return;
        setLoading(true);
        try {
            await executeTrade(symbol, name, type, currentPrice, quantity);
            toast({
                title: "Trade Successful",
                description: `${type === "BUY" ? "Bought" : "Sold"} ${quantity} shares of ${symbol} at ₹${currentPrice.toFixed(2)}`,
            });
            fetchBalance();
            onTradeComplete();
        } catch (error) {
            toast({
                title: "Trade Failed",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const totalCost = quantity * currentPrice;

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                        Trade {symbol}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[10px]">
                        <Wallet className="w-3 h-3" />
                        Balance: ₹{balance !== null ? balance.toLocaleString() : "..."}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Quantity</label>
                    <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        className="h-9 font-mono bg-background border-border focus-visible:ring-primary"
                    />
                </div>

                <div className="p-3 rounded-lg bg-background/50 border border-border space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                        <span>Price per share</span>
                        <span>Total Value</span>
                    </div>
                    <div className="flex justify-between font-mono font-bold">
                        <span>₹{currentPrice.toFixed(2)}</span>
                        <span className="text-primary text-base">₹{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                        onClick={() => handleTrade("BUY")}
                        disabled={loading || !currentPrice || (balance !== null && balance < totalCost)}
                        className="bg-buy hover:bg-buy/90 text-white font-bold gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                        BUY
                    </Button>
                    <Button
                        onClick={() => handleTrade("SELL")}
                        variant="outline"
                        disabled={loading || !currentPrice}
                        className="border-sell text-sell hover:bg-sell hover:text-white font-bold gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingDown className="w-4 h-4" />}
                        SELL
                    </Button>
                </div>

                {balance !== null && balance < totalCost && (
                    <p className="text-[10px] text-sell font-bold text-center">Insufficient balance to buy this quantity</p>
                )}
            </CardContent>
        </Card>
    );
};

export default TradingPanel;
