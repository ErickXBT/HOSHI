import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { useGetActiveWallet, getGetActiveWalletQueryKey, useGetPortfolio, getGetPortfolioQueryKey } from "@workspace/api-client-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Layers } from "lucide-react";

export default function Portfolio() {
  const { data: activeWallet } = useGetActiveWallet({ query: { queryKey: getGetActiveWalletQueryKey() } });
  const walletId = activeWallet?.id || 1;
  const { data: portfolio, isLoading } = useGetPortfolio(walletId, { query: { enabled: !!activeWallet, queryKey: getGetPortfolioQueryKey(walletId) } });

  return (
    <div className="flex-1 flex flex-col h-[100dvh] relative">
      <TopNav />
      
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-4 pt-6">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Portfolio</h2>
        
        <div className="bg-card rounded-3xl p-5 border border-border shadow-lg mb-6">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Wealth</p>
          {isLoading ? (
            <Skeleton className="h-8 w-32 mb-2" />
          ) : (
            <div className="text-3xl font-bold tracking-tight mb-2">
              ${portfolio?.totalBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
          
          {isLoading ? (
            <Skeleton className="h-5 w-24 rounded-full" />
          ) : (
            <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${portfolio && portfolio.gainPct >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {portfolio && portfolio.gainPct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
              {Math.abs(portfolio?.gainPct || 0).toFixed(2)}%
            </div>
          )}

          <div className="h-[200px] w-full mt-6">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={portfolio?.chartData}>
                  <XAxis dataKey="label" hide />
                  <YAxis domain={['dataMin', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={false}
                  />
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
            <p className="text-xl font-bold">{portfolio?.activeAssets || 0}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">Diversification</p>
            <p className="text-xl font-bold">{portfolio?.diversificationPct || 0}%</p>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-4">Gains by Period</h3>
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
          ) : (
            portfolio?.gainsByPeriod.map((gain, i) => (
              <div key={i} className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border">
                <span className="font-medium">{gain.period}</span>
                <div className="flex flex-col items-end">
                  <span className={`font-bold ${gain.gainPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {gain.gainPct >= 0 ? '+' : ''}${Math.abs(gain.gainUsd).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                  <span className={`text-xs ${gain.gainPct >= 0 ? 'text-green-500/80' : 'text-red-500/80'}`}>
                    {gain.gainPct >= 0 ? '+' : ''}{gain.gainPct.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
