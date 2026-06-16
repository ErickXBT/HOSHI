import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { useWallet } from "@/contexts/WalletContext";
import { useCoinPrices, getSolBalance } from "@/hooks/usePrices";
import { getEvmBalance } from "@/lib/wallet-gen";
import { Copy, QrCode, ArrowUpRight, ArrowDownLeft, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useIsDesktop } from "@/hooks/use-mobile";

interface TokenRow {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number;
  balance: number;
  balanceUsd: number;
  chain: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { activeWallet, isLocked } = useWallet();
  const { data: prices, isLoading: pricesLoading, refetch } = useCoinPrices();
  const { toast } = useToast();
  const isDesktop = useIsDesktop();

  const [ethBalance, setEthBalance] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isLocked) setLocation("/");
  }, [isLocked]);

  useEffect(() => {
    if (activeWallet?.evmAddress) {
      getEvmBalance(activeWallet.evmAddress).then(b => setEthBalance(parseFloat(b)));
    }
    if (activeWallet?.solAddress) {
      getSolBalance(activeWallet.solAddress).then(b => setSolBalance(b));
    }
  }, [activeWallet?.evmAddress, activeWallet?.solAddress]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    if (activeWallet?.evmAddress) {
      const b = await getEvmBalance(activeWallet.evmAddress);
      setEthBalance(parseFloat(b));
    }
    if (activeWallet?.solAddress) {
      const b = await getSolBalance(activeWallet.solAddress);
      setSolBalance(b);
    }
    setRefreshing(false);
  };

  const priceMap: Record<string, { price: number; change: number; image: string }> = {};
  if (prices) {
    for (const p of prices) {
      priceMap[p.symbol.toUpperCase()] = { price: p.current_price, change: p.price_change_percentage_24h, image: p.image };
    }
  }

  const tokens: TokenRow[] = [
    { id: "ethereum", symbol: "ETH", name: "Ethereum", image: priceMap["ETH"]?.image ?? "", price: priceMap["ETH"]?.price ?? 0, change24h: priceMap["ETH"]?.change ?? 0, balance: ethBalance ?? 0, balanceUsd: (ethBalance ?? 0) * (priceMap["ETH"]?.price ?? 0), chain: "ethereum" },
    { id: "solana", symbol: "SOL", name: "Solana", image: priceMap["SOL"]?.image ?? "", price: priceMap["SOL"]?.price ?? 0, change24h: priceMap["SOL"]?.change ?? 0, balance: solBalance ?? 0, balanceUsd: (solBalance ?? 0) * (priceMap["SOL"]?.price ?? 0), chain: "solana" },
    { id: "binancecoin", symbol: "BNB", name: "BNB Chain", image: priceMap["BNB"]?.image ?? "", price: priceMap["BNB"]?.price ?? 0, change24h: priceMap["BNB"]?.change ?? 0, balance: 0, balanceUsd: 0, chain: "bsc" },
    { id: "bitcoin", symbol: "BTC", name: "Bitcoin", image: priceMap["BTC"]?.image ?? "", price: priceMap["BTC"]?.price ?? 0, change24h: priceMap["BTC"]?.change ?? 0, balance: 0, balanceUsd: 0, chain: "bitcoin" },
    { id: "matic-network", symbol: "MATIC", name: "Polygon", image: priceMap["MATIC"]?.image ?? "", price: priceMap["MATIC"]?.price ?? 0, change24h: priceMap["MATIC"]?.change ?? 0, balance: 0, balanceUsd: 0, chain: "polygon" },
    { id: "arbitrum", symbol: "ARB", name: "Arbitrum", image: priceMap["ARB"]?.image ?? "", price: priceMap["ARB"]?.price ?? 0, change24h: priceMap["ARB"]?.change ?? 0, balance: 0, balanceUsd: 0, chain: "arbitrum" },
    { id: "optimism", symbol: "OP", name: "Optimism", image: priceMap["OP"]?.image ?? "", price: priceMap["OP"]?.price ?? 0, change24h: priceMap["OP"]?.change ?? 0, balance: 0, balanceUsd: 0, chain: "optimism" },
  ];

  const totalUsd = tokens.reduce((sum, t) => sum + t.balanceUsd, 0);
  const shortEvmAddr = activeWallet?.evmAddress
    ? `${activeWallet.evmAddress.slice(0, 6)}...${activeWallet.evmAddress.slice(-4)}`
    : "—";

  const handleCopy = () => {
    if (activeWallet?.evmAddress) {
      navigator.clipboard.writeText(activeWallet.evmAddress);
      toast({ title: "Copied", description: "Address copied to clipboard" });
    }
  };

  const isLoading = pricesLoading || ethBalance === null || solBalance === null;

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative`}>
      <TopNav />
      <div className={`flex-1 overflow-y-auto ${isDesktop ? "pb-8 px-6 pt-6" : "pb-24 px-4 py-6"} scrollbar-hide`}>

        {/* Balance Card */}
        <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden shadow-2xl mb-6">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm font-medium tracking-wide">Total Balance</span>
                <button onClick={() => setHideBalance(!hideBalance)} className="hover:text-foreground transition-colors">
                  {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button onClick={handleRefresh} className={`text-muted-foreground hover:text-foreground transition-colors ${refreshing ? "animate-spin" : ""}`}>
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {isLoading ? (
              <Skeleton className="h-10 w-40 rounded-lg mb-4" />
            ) : (
              <div className="text-4xl font-bold tracking-tight mb-4">
                {hideBalance ? "••••••" : `$${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            )}

            <div className="flex items-center justify-between w-full bg-black/40 rounded-xl p-3 border border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">W</div>
                <span className="font-mono text-sm">{shortEvmAddr}</span>
              </div>
              <button onClick={handleCopy} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Receive", icon: ArrowDownLeft, href: "/receive" },
            { label: "Send", icon: ArrowUpRight, href: "/send" },
            { label: "Scan", icon: QrCode, href: "/receive" },
          ].map(({ label, icon: Icon, href }) => (
            <Button key={label} variant="outline" onClick={() => setLocation(href)} className="h-auto py-3 flex flex-col gap-2 rounded-2xl bg-card border-border hover:bg-card/80 hover:text-primary hover:border-primary/50">
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{label}</span>
            </Button>
          ))}
        </div>

        {/* Token List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Assets</h3>
            <span className="text-xs text-muted-foreground">{tokens.filter(t => t.balance > 0).length} active</span>
          </div>

          <div className="space-y-1">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div><Skeleton className="w-20 h-4 mb-1" /><Skeleton className="w-12 h-3" /></div>
                  </div>
                  <div className="text-right"><Skeleton className="w-16 h-4 mb-1 ml-auto" /><Skeleton className="w-10 h-3 ml-auto" /></div>
                </div>
              ))
            ) : (
              tokens.map(token => (
                <div key={token.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-card/50 transition-colors border border-transparent hover:border-border cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black/40 border border-border flex items-center justify-center overflow-hidden">
                      {token.image
                        ? <img src={token.image} alt={token.symbol} className="w-7 h-7 object-contain" />
                        : <span className="text-xs font-bold">{token.symbol[0]}</span>
                      }
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{token.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">${token.price < 1 ? token.price.toPrecision(4) : token.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className={`text-[10px] font-medium ${token.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-sm">
                      {hideBalance ? "••••" : token.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {hideBalance ? "••••" : `$${token.balanceUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
