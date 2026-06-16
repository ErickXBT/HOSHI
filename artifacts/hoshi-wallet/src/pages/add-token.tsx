import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, Search, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCoinPrices } from "@/hooks/usePrices";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useIsDesktop } from "@/hooks/use-mobile";

export default function AddToken() {
  const { data: coins, isLoading } = useCoinPrices();
  const [search, setSearch] = useState("");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    bitcoin: true, ethereum: true, solana: true, binancecoin: false,
    "matic-network": false, arbitrum: false, optimism: false,
  });
  const isDesktop = useIsDesktop();

  const filtered = (coins ?? []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative bg-background`}>
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {isDesktop ? <h1 className="text-xl font-bold">Manage Assets</h1> : (
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card"><ArrowLeft className="w-5 h-5" /></Link>
        )}
        {!isDesktop && <h1 className="text-lg font-bold">Manage Assets</h1>}
        <div className="w-9" />
      </div>

      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search token name or symbol..."
            className="pl-10 bg-card border-border h-12 rounded-xl"
          />
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 ${isDesktop ? "pb-8" : "pb-24"} space-y-3`}>
        {isLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-3 w-24" /></div>
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))
        ) : (
          filtered.map(coin => (
            <div key={coin.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/40 border border-border flex items-center justify-center overflow-hidden">
                  <img src={coin.image} alt={coin.symbol} className="w-7 h-7 object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{coin.symbol.toUpperCase()}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-card border border-border rounded font-bold uppercase tracking-wider text-muted-foreground">
                      {coin.id.includes("solana") ? "SOL" : "EVM"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{coin.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  ${coin.current_price < 0.01 ? coin.current_price.toPrecision(3) : coin.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <Switch
                  checked={enabled[coin.id] ?? false}
                  onCheckedChange={c => setEnabled(prev => ({ ...prev, [coin.id]: c }))}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          ))
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No tokens found for "{search}"</p>
            <Button variant="outline" size="sm" className="mt-4 border-primary/30 text-primary hover:bg-primary/10" asChild>
              <a href={`https://www.coingecko.com/en/search?query=${search}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Search on CoinGecko
              </a>
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
