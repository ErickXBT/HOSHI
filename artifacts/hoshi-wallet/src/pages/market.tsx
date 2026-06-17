import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { useCoinPrices, useMarketOverview, useTrendingCoins, type CoinPrice, type TrendingCoin } from "@/hooks/usePrices";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, Flame, TrendingUp } from "lucide-react";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useState } from "react";
import { CoinDetailDialog, type CoinDialogData } from "@/components/CoinDetailDialog";

const MARKET_CHAIN: Record<string, string> = {
  bitcoin: "btc", ethereum: "eth", solana: "sol",
  binancecoin: "bnb", "matic-network": "polygon",
  arbitrum: "arb", optimism: "op",
};

function toCoinDialogData(coin: CoinPrice | TrendingCoin): CoinDialogData {
  if ("current_price" in coin) {
    return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      image: coin.image,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h ?? 0,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      chain: MARKET_CHAIN[coin.id] ?? "",
    };
  }
  return {
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    image: coin.thumb,
    price: coin.price,
    change24h: coin.change24h,
    chain: MARKET_CHAIN[coin.id] ?? "",
  };
}

export default function Market() {
  const { data: coins, isLoading: coinsLoading } = useCoinPrices();
  const { data: overview, isLoading: overviewLoading } = useMarketOverview();
  const { data: trending, isLoading: trendingLoading } = useTrendingCoins();
  const isDesktop = useIsDesktop();
  const [selectedCoin, setSelectedCoin] = useState<CoinDialogData | null>(null);

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative`}>
      <TopNav />

      <div className={`flex-1 overflow-y-auto ${isDesktop ? "px-6 pt-6 pb-8" : "pb-24 px-4 pt-6"} scrollbar-hide`}>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Market</h2>

        {/* Global Overview */}
        <div className="bg-card rounded-3xl p-5 border border-border shadow-lg mb-8">
          <p className="text-sm text-muted-foreground font-medium mb-1">Global Market Cap</p>
          {overviewLoading ? <Skeleton className="h-8 w-36 mb-3" /> : (
            <div className="text-3xl font-bold tracking-tight mb-3 flex items-center gap-3">
              ${overview && overview.totalMarketCapUsd >= 1e12
                ? (overview.totalMarketCapUsd / 1e12).toFixed(2) + "T"
                : overview ? (overview.totalMarketCapUsd / 1e9).toFixed(2) + "B" : "—"}
              {overview && (
                <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${overview.change24hPct >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  {overview.change24hPct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                  {Math.abs(overview.change24hPct).toFixed(2)}%
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "BTC Dominance", value: overview ? `${overview.btcDominancePct.toFixed(1)}%` : null },
              { label: "ETH Dominance", value: overview ? `${overview.ethDominancePct.toFixed(1)}%` : null },
              { label: "24h Volume",    value: overview ? `$${(overview.volume24hUsd / 1e9).toFixed(1)}B` : null },
              { label: "Fear & Greed", value: overview ? `${overview.fearGreedIndex} — ${overview.fearGreedLabel}` : null },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                {overviewLoading || !value ? <Skeleton className="h-5 w-16" /> : <p className="font-bold text-sm">{value}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Live Prices */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Live Prices</h3>
            <span className="text-xs text-muted-foreground ml-auto">Tap for details</span>
          </div>
          {coinsLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl mb-2" />)
          ) : (
            <div className="space-y-2">
              {coins?.map(coin => (
                <button
                  key={coin.id}
                  onClick={() => setSelectedCoin(toCoinDialogData(coin))}
                  className="w-full flex items-center justify-between bg-card p-3.5 rounded-2xl border border-border hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-border bg-black/40 flex items-center justify-center">
                      <img src={coin.image} alt={coin.symbol} className="w-6 h-6 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">{coin.symbol.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">{coin.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      {coin.current_price == null ? "—" : `$${coin.current_price < 0.01
                        ? coin.current_price.toPrecision(4)
                        : coin.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </p>
                    <p className={`text-xs font-medium ${(coin.price_change_percentage_24h ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {(coin.price_change_percentage_24h ?? 0) >= 0 ? "+" : ""}{(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Trending */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Trending</h3>
            <span className="text-xs text-muted-foreground ml-auto">Tap for details</span>
          </div>
          {trendingLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl mb-2" />)
          ) : (
            <div className="space-y-2">
              {trending?.map((coin, i) => (
                <button
                  key={coin.id}
                  onClick={() => setSelectedCoin(toCoinDialogData(coin))}
                  className="w-full flex items-center justify-between bg-card p-3.5 rounded-2xl border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-bold w-5 text-sm text-left">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-border flex items-center justify-center overflow-hidden">
                      <img src={coin.thumb} alt={coin.symbol} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">{coin.symbol.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">{coin.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {coin.price > 0 && <p className="font-bold text-sm">${coin.price < 0.01 ? coin.price.toPrecision(3) : coin.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>}
                    <p className={`text-xs font-medium ${coin.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(1)}%
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      <CoinDetailDialog coin={selectedCoin} onClose={() => setSelectedCoin(null)} />
    </div>
  );
}
