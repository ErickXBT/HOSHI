import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { useGetActiveWallet, getGetActiveWalletQueryKey, useGetPortfolio, getGetPortfolioQueryKey, useListTokens, getListTokensQueryKey } from "@workspace/api-client-react";
import { Copy, QrCode, ArrowUpRight, ArrowDownLeft, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiBitcoin, SiEthereum, SiSolana } from "react-icons/si";

export default function Dashboard() {
  const { data: activeWallet, isLoading: isLoadingWallet } = useGetActiveWallet({ query: { queryKey: getGetActiveWalletQueryKey() } });
  
  const walletId = activeWallet?.id || 1;
  const { data: portfolio, isLoading: isLoadingPortfolio } = useGetPortfolio(walletId, { query: { enabled: !!activeWallet, queryKey: getGetPortfolioQueryKey(walletId) } });
  const { data: tokens, isLoading: isLoadingTokens } = useListTokens(walletId, { query: { enabled: !!activeWallet, queryKey: getListTokensQueryKey(walletId) } });

  const getChainIcon = (chain: string) => {
    switch(chain.toLowerCase()) {
      case 'bitcoin': return <SiBitcoin className="w-6 h-6 text-[#F7931A]" />;
      case 'ethereum': return <SiEthereum className="w-6 h-6 text-[#627EEA]" />;
      case 'solana': return <SiSolana className="w-6 h-6 text-[#14F195]" />;
      default: return <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{chain.charAt(0).toUpperCase()}</div>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[100dvh] relative">
      <TopNav />
      
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        <div className="px-4 py-6">
          {/* Balance Card */}
          <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <span className="text-sm font-medium tracking-wide">Total Balance</span>
                <Eye className="w-4 h-4 cursor-pointer" />
              </div>
              
              {isLoadingPortfolio ? (
                <Skeleton className="h-10 w-40 rounded-lg mb-4" />
              ) : (
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-4xl font-bold tracking-tight">${portfolio?.totalBalanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              {isLoadingPortfolio ? (
                <Skeleton className="h-6 w-24 rounded-full mb-6" />
              ) : (
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 mb-6 ${portfolio && portfolio.gainPct >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {portfolio && portfolio.gainPct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                  {Math.abs(portfolio?.gainPct || 0).toFixed(2)}% (+${Math.abs(portfolio?.gainUsd || 0).toFixed(2)})
                </div>
              )}

              <div className="flex items-center justify-between w-full bg-black/40 rounded-xl p-3 border border-border/50">
                <div className="flex items-center gap-2">
                  <SiBitcoin className="text-[#F7931A] w-5 h-5" />
                  <span className="text-sm font-medium">BTC Balance</span>
                </div>
                <span className="text-sm font-bold">0.4521 BTC</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-2 rounded-2xl bg-card border-border hover:bg-card/80 hover:text-primary">
              <ArrowDownLeft className="w-5 h-5" />
              <span className="text-xs font-semibold">Receive</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-2 rounded-2xl bg-card border-border hover:bg-card/80 hover:text-primary">
              <ArrowUpRight className="w-5 h-5" />
              <span className="text-xs font-semibold">Send</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-2 rounded-2xl bg-card border-border hover:bg-card/80 hover:text-primary">
              <QrCode className="w-5 h-5" />
              <span className="text-xs font-semibold">Scan</span>
            </Button>
          </div>

          {/* Token List */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Assets</h3>
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              {isLoadingTokens ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div>
                        <Skeleton className="w-20 h-4 mb-1" />
                        <Skeleton className="w-12 h-3" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="w-16 h-4 mb-1 ml-auto" />
                      <Skeleton className="w-10 h-3 ml-auto" />
                    </div>
                  </div>
                ))
              ) : (
                tokens?.map(token => (
                  <div key={token.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-card/50 transition-colors border border-transparent hover:border-border cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black/40 border border-border flex items-center justify-center">
                        {token.logoUrl ? <img src={token.logoUrl} alt={token.symbol} className="w-6 h-6" /> : getChainIcon(token.chain)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{token.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground">${token.priceUsd.toLocaleString()}</span>
                          <span className={`text-[10px] font-medium ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-sm">{token.balance.toLocaleString(undefined, {maximumFractionDigits: 4})}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">${token.balanceUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
