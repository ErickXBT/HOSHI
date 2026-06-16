import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { useCoinPrices, useMarketOverview, useTrendingCoins, type CoinPrice, type TrendingCoin } from "@/hooks/usePrices";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, Flame, TrendingUp, X, ExternalLink, BarChart2 } from "lucide-react";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function Sparkline({ prices }: { prices: number[] }) {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 280, H = 80;
  const pts = prices.map((p, i) => [
    (i / (prices.length - 1)) * W,
    H - ((p - min) / range) * (H - 10) - 5,
  ]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${path} L${W},${H} L0,${H} Z`;
  const last = prices[prices.length - 1];
  const first = prices[0];
  const isUp = last >= first;
  const color = isUp ? "#22c55e" : "#ef4444";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CoinDetailDialog({
  coin,
  onClose,
}: {
  coin: (CoinPrice & { sparkline?: number[] }) | TrendingCoin | null;
  onClose: () => void;
}) {
  const [sparkline, setSparkline] = useState<number[]>([]);
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const isCoinPrice = coin && "current_price" in coin;
  const id = coin?.id ?? "";
  const name = coin?.name ?? "";
  const symbol = coin ? ("symbol" in coin ? coin.symbol : "") : "";
  const image = coin && "image" in coin ? (coin as CoinPrice).image : coin && "thumb" in coin ? (coin as TrendingCoin).thumb : "";
  const price = isCoinPrice ? (coin as CoinPrice).current_price : coin && "price" in coin ? (coin as TrendingCoin).price : 0;
  const change24h = isCoinPrice
    ? (coin as CoinPrice).price_change_percentage_24h ?? 0
    : coin && "change24h" in coin ? (coin as TrendingCoin).change24h : 0;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.allSettled([
      fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`)
        .then(r => r.json())
        .then(d => {
          const pts: number[] = (d.prices ?? []).map((p: [number, number]) => p[1]);
          setSparkline(pts);
        }),
      fetch(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`)
        .then(r => r.json())
        .then(d => setDetails(d)),
    ]).finally(() => setLoading(false));
  }, [id]);

  const mktCap = isCoinPrice ? (coin as CoinPrice).market_cap : (details?.market_data as any)?.market_cap?.usd ?? 0;
  const vol24h = isCoinPrice ? (coin as CoinPrice).total_volume : (details?.market_data as any)?.total_volume?.usd ?? 0;
  const desc: string = ((details?.description as any)?.en ?? "").replace(/<[^>]+>/g, "").slice(0, 200);

  const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${n.toFixed(2)}`;

  return (
    <Dialog open={!!coin} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-card border-border rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {image && <img src={image} alt={symbol} className="w-10 h-10 rounded-full border border-border" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
            <div>
              <p className="font-bold">{symbol.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">{name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/20 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price */}
        <div className="px-4 pt-4 pb-2">
          <div className="text-3xl font-bold">
            {price > 0 ? `$${price < 0.01 ? price.toPrecision(4) : price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          </div>
          <div className={`text-sm font-semibold flex items-center gap-1 mt-1 ${change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
            {change24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
            {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}% (24h)
          </div>
        </div>

        {/* Sparkline */}
        <div className="px-4">
          {loading ? <Skeleton className="h-20 w-full rounded-xl" /> : <Sparkline prices={sparkline} />}
          <p className="text-[10px] text-muted-foreground text-right">7-day price chart</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-3">
          {[
            { label: "Market Cap", value: mktCap > 0 ? fmt(mktCap) : "—" },
            { label: "24h Volume", value: vol24h > 0 ? fmt(vol24h) : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
              <p className="font-bold text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        {desc && <p className="text-xs text-muted-foreground px-4 pb-3 leading-relaxed line-clamp-3">{desc}...</p>}

        {/* Link */}
        <div className="px-4 pb-4">
          <a
            href={`https://www.coingecko.com/en/coins/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-bold hover:bg-primary/10 transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            View Full Chart
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Market() {
  const { data: coins, isLoading: coinsLoading } = useCoinPrices();
  const { data: overview, isLoading: overviewLoading } = useMarketOverview();
  const { data: trending, isLoading: trendingLoading } = useTrendingCoins();
  const isDesktop = useIsDesktop();
  const [selectedCoin, setSelectedCoin] = useState<CoinPrice | TrendingCoin | null>(null);

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
                  onClick={() => setSelectedCoin(coin)}
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
                  onClick={() => setSelectedCoin(coin)}
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
