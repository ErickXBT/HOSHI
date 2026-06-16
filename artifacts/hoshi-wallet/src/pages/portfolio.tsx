import { useEffect, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { useWallet } from "@/contexts/WalletContext";
import { useCoinPrices, getSolBalance } from "@/hooks/usePrices";
import { getEvmBalance } from "@/lib/wallet-gen";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Layers } from "lucide-react";
import { useIsDesktop } from "@/hooks/use-mobile";

const PERIODS = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

export default function Portfolio() {
  const { activeWallet } = useWallet();
  const { data: prices, isLoading } = useCoinPrices();
  const [ethBalance, setEthBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [period, setPeriod] = useState("1M");
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (activeWallet?.evmAddress) getEvmBalance(activeWallet.evmAddress).then(b => setEthBalance(parseFloat(b)));
    if (activeWallet?.solAddress) getSolBalance(activeWallet.solAddress).then(b => setSolBalance(b));
  }, [activeWallet?.evmAddress, activeWallet?.solAddress]);

  const priceMap: Record<string, number> = {};
  const changeMap: Record<string, number> = {};
  if (prices) {
    for (const p of prices) {
      priceMap[p.symbol.toUpperCase()] = p.current_price;
      changeMap[p.symbol.toUpperCase()] = p.price_change_percentage_24h;
    }
  }

  const ethPrice = priceMap["ETH"] ?? 0;
  const solPrice = priceMap["SOL"] ?? 0;
  const totalUsd = ethBalance * ethPrice + solBalance * solPrice;
  const dailyChange = (ethBalance * ethPrice * (changeMap["ETH"] ?? 0) / 100) + (solBalance * solPrice * (changeMap["SOL"] ?? 0) / 100);
  const gainPct = totalUsd > 0 ? (dailyChange / totalUsd) * 100 : 0;

  const chartData = Array.from({ length: 30 }, (_, i) => ({
    label: `Day ${i + 1}`,
    value: totalUsd * (0.85 + Math.random() * 0.3),
  }));
  chartData[29] = { label: "Now", value: totalUsd };

  const assets = [
    { symbol: "ETH", name: "Ethereum", balance: ethBalance, price: ethPrice, change: changeMap["ETH"] ?? 0, color: "#627EEA" },
    { symbol: "SOL", name: "Solana", balance: solBalance, price: solPrice, change: changeMap["SOL"] ?? 0, color: "#14F195" },
  ].filter(a => a.balance > 0);

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative`}>
      <TopNav />
      <div className={`flex-1 overflow-y-auto ${isDesktop ? "px-6 pt-6 pb-8" : "pb-24 px-4 pt-6"} scrollbar-hide`}>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Portfolio</h2>

        <div className="bg-card rounded-3xl p-5 border border-border shadow-lg mb-6">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Wealth</p>
          {isLoading ? <Skeleton className="h-8 w-36 mb-2" /> : (
            <div className="text-3xl font-bold tracking-tight mb-2">
              ${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
          {isLoading ? <Skeleton className="h-5 w-24 rounded-full" /> : (
            <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${gainPct >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
              {gainPct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
              {Math.abs(gainPct).toFixed(2)}% (24h)
            </div>
          )}

          <div className="flex gap-1 mt-4 mb-2">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {p}
              </button>
            ))}
          </div>

          <div className="h-[180px] w-full mt-4">
            {isLoading ? <Skeleton className="w-full h-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="label" hide />
                  <YAxis domain={["dataMin", "auto"]} hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Value"]}
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card p-4 rounded-2xl border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">Active Assets</p>
            <p className="text-xl font-bold">{assets.length || "0"}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">24h Change</p>
            <p className={`text-xl font-bold ${dailyChange >= 0 ? "text-green-500" : "text-red-500"}`}>
              {dailyChange >= 0 ? "+" : ""}${Math.abs(dailyChange).toFixed(2)}
            </p>
          </div>
        </div>

        {assets.length > 0 && (
          <>
            <h3 className="font-bold text-lg mb-4">My Holdings</h3>
            <div className="space-y-3">
              {assets.map(a => (
                <div key={a.symbol} className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: a.color + "20", color: a.color }}>
                      {a.symbol[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {a.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">${(a.balance * a.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className={`text-xs font-medium ${a.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {a.change >= 0 ? "+" : ""}{a.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {assets.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <h3 className="font-bold text-lg mb-2">Portfolio Empty</h3>
            <p className="text-sm text-muted-foreground max-w-[220px]">Fund your wallet to start tracking your portfolio.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
