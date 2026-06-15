import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { useGetMarketOverview, getGetMarketOverviewQueryKey, useGetTrendingTokens, getGetTrendingTokensQueryKey, useGetMarketNews, getGetMarketNewsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, Flame, Newspaper } from "lucide-react";

export default function Market() {
  const { data: overview, isLoading: isLoadingOverview } = useGetMarketOverview({ query: { queryKey: getGetMarketOverviewQueryKey() } });
  const { data: trending, isLoading: isLoadingTrending } = useGetTrendingTokens({ query: { queryKey: getGetTrendingTokensQueryKey() } });
  const { data: news, isLoading: isLoadingNews } = useGetMarketNews({ query: { queryKey: getGetMarketNewsQueryKey() } });

  return (
    <div className="flex-1 flex flex-col h-[100dvh] relative">
      <TopNav />
      
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-4 pt-6">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Market</h2>
        
        {/* Market Overview */}
        <div className="bg-card rounded-3xl p-5 border border-border shadow-lg mb-8">
          <p className="text-sm text-muted-foreground font-medium mb-1">Global Market Cap</p>
          {isLoadingOverview ? (
            <Skeleton className="h-8 w-32 mb-2" />
          ) : (
            <div className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              ${(overview?.totalMarketCapUsd || 0) >= 1e12 ? ((overview?.totalMarketCapUsd || 0) / 1e12).toFixed(2) + 'T' : ((overview?.totalMarketCapUsd || 0) / 1e9).toFixed(2) + 'B'}
              <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${overview && overview.change24hPct >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {overview && overview.change24hPct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                {Math.abs(overview?.change24hPct || 0).toFixed(2)}%
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">BTC Dominance</p>
              {isLoadingOverview ? <Skeleton className="h-5 w-16" /> : <p className="font-bold">{overview?.btcDominancePct.toFixed(1)}%</p>}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ETH Dominance</p>
              {isLoadingOverview ? <Skeleton className="h-5 w-16" /> : <p className="font-bold">{overview?.ethDominancePct.toFixed(1)}%</p>}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">24h Vol</p>
              {isLoadingOverview ? <Skeleton className="h-5 w-20" /> : <p className="font-bold">${((overview?.volume24hUsd || 0) / 1e9).toFixed(1)}B</p>}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Fear & Greed</p>
              {isLoadingOverview ? <Skeleton className="h-5 w-20" /> : (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{overview?.fearGreedIndex}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${overview && overview.fearGreedIndex > 50 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {overview?.fearGreedLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trending */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Trending Coins</h3>
          </div>
          <div className="space-y-3">
            {isLoadingTrending ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
            ) : (
              trending?.map((token, i) => (
                <div key={i} className="flex items-center justify-between bg-card p-3.5 rounded-2xl border border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-bold w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-border flex items-center justify-center overflow-hidden">
                      {token.logoUrl ? <img src={token.logoUrl} alt={token.symbol} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{token.symbol[0]}</span>}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{token.symbol}</span>
                      <span className="text-xs text-muted-foreground">{token.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-sm">${token.priceUsd < 0.01 ? token.priceUsd.toPrecision(4) : token.priceUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span className={`text-xs font-medium flex items-center ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* News */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Latest Intel</h3>
          </div>
          <div className="space-y-4">
            {isLoadingNews ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
            ) : (
              news?.map((article, i) => (
                <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" className="block bg-card p-4 rounded-2xl border border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{article.source}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-[10px] text-muted-foreground">{new Date(article.publishedAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-sm line-clamp-2 leading-snug">{article.title}</h4>
                      {article.sentiment && (
                        <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          article.sentiment === 'bullish' ? 'bg-green-500/10 text-green-500' : 
                          article.sentiment === 'bearish' ? 'bg-red-500/10 text-red-500' : 
                          'bg-muted text-muted-foreground'
                        }`}>
                          {article.sentiment}
                        </span>
                      )}
                    </div>
                    {article.imageUrl && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
