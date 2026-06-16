import { BottomNav } from "@/components/layout/BottomNav";
import { TopNav } from "@/components/layout/TopNav";
import { ArrowLeft, ExternalLink, RefreshCw, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsDesktop } from "@/hooks/use-mobile";

interface PolyMarket {
  id: string;
  question: string;
  description: string;
  slug: string;
  startDate: string;
  endDate: string;
  active: boolean;
  volume: number;
  liquidity: number;
  outcomes: string[];
  outcomePrices: string[];
  image?: string;
  icon?: string;
}

async function fetchMarkets(): Promise<PolyMarket[]> {
  const res = await fetch(
    "https://gamma-api.polymarket.com/markets?limit=30&active=true&order=volume&ascending=false"
  );
  if (!res.ok) throw new Error("Polymarket API error");
  const data = await res.json();
  return data.filter((m: any) => m.active && m.question).map((m: any) => {
    let outcomes: string[] = [];
    let outcomePrices: string[] = [];
    try { outcomes = JSON.parse(m.outcomes ?? "[]"); } catch { outcomes = ["Yes", "No"]; }
    try { outcomePrices = JSON.parse(m.outcomePrices ?? "[]"); } catch { outcomePrices = ["0.5", "0.5"]; }
    return {
      id: m.id,
      question: m.question,
      description: m.description ?? "",
      slug: m.slug ?? m.id,
      startDate: m.startDate ?? "",
      endDate: m.endDate ?? "",
      active: m.active,
      volume: parseFloat(m.volume ?? "0"),
      liquidity: parseFloat(m.liquidity ?? "0"),
      outcomes,
      outcomePrices,
      image: m.image,
      icon: m.icon,
    };
  });
}

function fmtVol(v: number): string {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function MarketCard({ market }: { market: PolyMarket }) {
  const yesIdx = market.outcomes.findIndex(o => o.toLowerCase() === "yes");
  const yesPrice = yesIdx >= 0 && market.outcomePrices[yesIdx]
    ? parseFloat(market.outcomePrices[yesIdx])
    : parseFloat(market.outcomePrices[0] ?? "0.5");
  const yesPct = Math.round(yesPrice * 100);
  const isHighProb = yesPct >= 60;
  const isLowProb = yesPct <= 40;

  const daysLeft = market.endDate
    ? Math.max(0, Math.ceil((new Date(market.endDate).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <a
      href={`https://polymarket.com/event/${market.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-card rounded-2xl p-4 border border-border hover:border-primary/30 transition-colors group"
    >
      <div className="flex gap-3 mb-3">
        {market.icon && (
          <div className="w-10 h-10 rounded-full overflow-hidden border border-border shrink-0 bg-black/30">
            <img src={market.icon} alt="" className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}
        <p className="font-bold text-sm leading-snug group-hover:text-primary transition-colors flex-1">
          {market.question}
        </p>
      </div>

      {/* Probability bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className={`font-bold ${isHighProb ? "text-green-500" : isLowProb ? "text-red-500" : "text-muted-foreground"}`}>
            {isHighProb ? <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{yesPct}% Yes</span>
              : isLowProb ? <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" />{yesPct}% Yes</span>
              : `${yesPct}% Yes`}
          </span>
          <span className="text-muted-foreground">{100 - yesPct}% No</span>
        </div>
        <div className="h-2 rounded-full bg-card border border-border overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isHighProb ? "bg-green-500" : isLowProb ? "bg-red-500" : "bg-primary"}`}
            style={{ width: `${yesPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          <span>Vol: {fmtVol(market.volume)}</span>
        </div>
        {market.liquidity > 0 && (
          <span>Liq: {fmtVol(market.liquidity)}</span>
        )}
        {daysLeft !== null && (
          <span className="ml-auto">{daysLeft === 0 ? "Ends today" : `${daysLeft}d left`}</span>
        )}
        <ExternalLink className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary/60" />
      </div>
    </a>
  );
}

export default function Polymarket() {
  const [markets, setMarkets] = useState<PolyMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const isDesktop = useIsDesktop();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const data = await fetchMarkets();
      setMarkets(data);
    } catch {
      setError("Could not load Polymarket data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative bg-background`}>
      {!isDesktop && <TopNav />}

      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {isDesktop ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-black">P</span>
            </div>
            <h1 className="text-xl font-bold">Polymarket</h1>
          </div>
        ) : (
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        {!isDesktop && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-[9px] font-black">P</span>
            </div>
            <h1 className="text-lg font-bold">Polymarket</h1>
          </div>
        )}
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="p-2 rounded-full hover:bg-card text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto ${isDesktop ? "pb-8 px-6 pt-6 max-w-3xl" : "pb-24 px-4 pt-4"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Real-time prediction markets</span>
          </div>
          <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-primary flex items-center gap-1">
            polymarket.com <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm mb-3">{error}</p>
            <button onClick={() => load()} className="text-primary text-sm font-bold">Try again</button>
          </div>
        )}

        {loading && !error && (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {markets.map(m => <MarketCard key={m.id} market={m} />)}
            {markets.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-12">No active markets found.</p>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
