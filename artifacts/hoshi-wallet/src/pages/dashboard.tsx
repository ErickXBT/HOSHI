import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { useWallet } from "@/hooks/useWallet";
import { useCoinPrices, getSolBalance } from "@/hooks/usePrices";
import { getEvmBalance } from "@/lib/wallet-gen";
import { Copy, ArrowUpRight, ArrowDownLeft, Eye, EyeOff, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useIsDesktop } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { CoinDetailDialog, type CoinDialogData } from "@/components/CoinDetailDialog";

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
  marketCap?: number;
  volume24h?: number;
}

interface ChainBalance {
  eth: number | null;
  sol: number | null;
  bnb: number | null;
  matic: number | null;
}

async function fetchAllEvmBalances(address: string): Promise<{ eth: number; bnb: number; matic: number }> {
  const RPCS = {
    eth: ["https://1rpc.io/eth", "https://eth.llamarpc.com", "https://rpc.ankr.com/eth"],
    bnb: ["https://rpc.ankr.com/bsc", "https://bsc-dataseed1.binance.org"],
    matic: ["https://rpc.ankr.com/polygon", "https://polygon-rpc.com"],
  };

  async function tryBalance(rpcs: string[]): Promise<number> {
    for (const rpc of rpcs) {
      try {
        const val = await getEvmBalance(address, rpc);
        const n = parseFloat(val);
        if (!isNaN(n)) return n;
      } catch {}
    }
    return 0;
  }

  const [eth, bnb, matic] = await Promise.all([
    tryBalance(RPCS.eth),
    tryBalance(RPCS.bnb),
    tryBalance(RPCS.matic),
  ]);
  return { eth, bnb, matic };
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { activeWallet, wallets, setActiveWalletId, isLocked } = useWallet();
  const { data: prices, isLoading: pricesLoading, refetch } = useCoinPrices();
  const { toast } = useToast();
  const isDesktop = useIsDesktop();

  const [balances, setBalances] = useState<ChainBalance>({ eth: null, sol: null, bnb: null, matic: null });
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CoinDialogData | null>(null);

  useEffect(() => {
    if (isLocked) setLocation("/");
  }, [isLocked]);

  const fetchBalances = useCallback(async () => {
    if (!activeWallet) return;
    const [evm, sol] = await Promise.all([
      fetchAllEvmBalances(activeWallet.evmAddress),
      getSolBalance(activeWallet.solAddress),
    ]);
    setBalances({ eth: evm.eth, bnb: evm.bnb, matic: evm.matic, sol });
  }, [activeWallet?.evmAddress, activeWallet?.solAddress]);

  useEffect(() => {
    setBalances({ eth: null, sol: null, bnb: null, matic: null });
    fetchBalances();
    const interval = setInterval(fetchBalances, 30_000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), fetchBalances()]);
    setRefreshing(false);
  };

  const priceMap: Record<string, { price: number; change: number; image: string; marketCap: number; volume24h: number }> = {};
  if (prices) {
    for (const p of prices) {
      priceMap[p.symbol.toUpperCase()] = {
        price: p.current_price,
        change: p.price_change_percentage_24h,
        image: p.image,
        marketCap: p.market_cap,
        volume24h: p.total_volume,
      };
    }
  }

  const tokens: TokenRow[] = [
    { id: "ethereum",     symbol: "ETH",  name: "Ethereum",  image: priceMap["ETH"]?.image  ?? "", price: priceMap["ETH"]?.price  ?? 0, change24h: priceMap["ETH"]?.change  ?? 0, balance: balances.eth  ?? 0, balanceUsd: (balances.eth  ?? 0) * (priceMap["ETH"]?.price  ?? 0), chain: "ethereum", marketCap: priceMap["ETH"]?.marketCap,  volume24h: priceMap["ETH"]?.volume24h  },
    { id: "solana",       symbol: "SOL",  name: "Solana",    image: priceMap["SOL"]?.image  ?? "", price: priceMap["SOL"]?.price  ?? 0, change24h: priceMap["SOL"]?.change  ?? 0, balance: balances.sol  ?? 0, balanceUsd: (balances.sol  ?? 0) * (priceMap["SOL"]?.price  ?? 0), chain: "solana",   marketCap: priceMap["SOL"]?.marketCap,  volume24h: priceMap["SOL"]?.volume24h  },
    { id: "binancecoin",  symbol: "BNB",  name: "BNB Chain", image: priceMap["BNB"]?.image  ?? "", price: priceMap["BNB"]?.price  ?? 0, change24h: priceMap["BNB"]?.change  ?? 0, balance: balances.bnb  ?? 0, balanceUsd: (balances.bnb  ?? 0) * (priceMap["BNB"]?.price  ?? 0), chain: "bsc",      marketCap: priceMap["BNB"]?.marketCap,  volume24h: priceMap["BNB"]?.volume24h  },
    { id: "matic-network",symbol: "POL",  name: "Polygon",   image: priceMap["MATIC"]?.image ?? priceMap["POL"]?.image ?? "", price: priceMap["MATIC"]?.price ?? priceMap["POL"]?.price ?? 0, change24h: priceMap["MATIC"]?.change ?? priceMap["POL"]?.change ?? 0, balance: balances.matic ?? 0, balanceUsd: (balances.matic ?? 0) * (priceMap["MATIC"]?.price ?? priceMap["POL"]?.price ?? 0), chain: "polygon", marketCap: priceMap["MATIC"]?.marketCap, volume24h: priceMap["MATIC"]?.volume24h },
    { id: "bitcoin",      symbol: "BTC",  name: "Bitcoin",   image: priceMap["BTC"]?.image  ?? "", price: priceMap["BTC"]?.price  ?? 0, change24h: priceMap["BTC"]?.change  ?? 0, balance: 0, balanceUsd: 0, chain: "bitcoin",   marketCap: priceMap["BTC"]?.marketCap,  volume24h: priceMap["BTC"]?.volume24h  },
    { id: "arbitrum",     symbol: "ARB",  name: "Arbitrum",  image: priceMap["ARB"]?.image  ?? "", price: priceMap["ARB"]?.price  ?? 0, change24h: priceMap["ARB"]?.change  ?? 0, balance: 0, balanceUsd: 0, chain: "arbitrum",  marketCap: priceMap["ARB"]?.marketCap,  volume24h: priceMap["ARB"]?.volume24h  },
    { id: "optimism",     symbol: "OP",   name: "Optimism",  image: priceMap["OP"]?.image   ?? "", price: priceMap["OP"]?.price   ?? 0, change24h: priceMap["OP"]?.change   ?? 0, balance: 0, balanceUsd: 0, chain: "optimism",  marketCap: priceMap["OP"]?.marketCap,   volume24h: priceMap["OP"]?.volume24h   },
  ];

  const totalUsd = tokens.reduce((sum, t) => sum + t.balanceUsd, 0);
  const shortEvmAddr = activeWallet?.evmAddress
    ? `${activeWallet.evmAddress.slice(0, 6)}...${activeWallet.evmAddress.slice(-4)}`
    : "—";

  const handleCopy = () => {
    if (activeWallet?.evmAddress) {
      navigator.clipboard.writeText(activeWallet.evmAddress);
      toast({ title: "Copied", description: "EVM address copied to clipboard" });
    }
  };

  const handleCopySol = () => {
    if (activeWallet?.solAddress) {
      navigator.clipboard.writeText(activeWallet.solAddress);
      toast({ title: "Copied", description: "Solana address copied" });
    }
  };

  const isLoading = pricesLoading || balances.eth === null;

  const openCoinDetail = (token: TokenRow) => {
    setSelectedCoin({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      image: token.image,
      price: token.price,
      change24h: token.change24h,
      marketCap: token.marketCap,
      volume24h: token.volume24h,
    });
  };

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

            {/* EVM Address */}
            <div className="flex items-center justify-between w-full bg-black/40 rounded-xl p-3 border border-border/50 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                  {activeWallet?.name?.charAt(0)?.toUpperCase() ?? "W"}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{activeWallet?.name} · EVM</p>
                  <p className="font-mono text-sm">{shortEvmAddr}</p>
                </div>
              </div>
              <button onClick={handleCopy} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* SOL Address */}
            {activeWallet?.solAddress && (
              <div className="flex items-center justify-between w-full bg-black/40 rounded-xl p-3 border border-border/50 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-[#14F195]/20 flex items-center justify-center shrink-0">
                    <span className="text-[8px] font-bold text-[#14F195]">S</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{activeWallet?.name} · Solana</p>
                    <p className="font-mono text-sm truncate max-w-[180px]">{activeWallet.solAddress.slice(0,6)}...{activeWallet.solAddress.slice(-4)}</p>
                  </div>
                </div>
                <button onClick={handleCopySol} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0">
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Multi-wallet quick switch */}
            {wallets.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {wallets.slice(0, 4).map(w => (
                  <button
                    key={w.id}
                    onClick={() => setActiveWalletId(w.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                      w.id === activeWallet?.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-current/20 flex items-center justify-center text-[7px] font-bold">
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                    {w.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Receive", icon: ArrowDownLeft, href: "/receive" },
            { label: "Send",    icon: ArrowUpRight,  href: "/send" },
            { label: "Swap",    icon: RefreshCw,     href: "/swap" },
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
                <button
                  key={token.id}
                  onClick={() => openCoinDetail(token)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-card/50 transition-colors border border-transparent hover:border-border cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black/40 border border-border flex items-center justify-center overflow-hidden">
                      {token.image
                        ? <img src={token.image} alt={token.symbol} className="w-7 h-7 object-contain" />
                        : <span className="text-xs font-bold">{token.symbol[0]}</span>
                      }
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-sm">{token.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">${token.price < 1 ? token.price.toPrecision(4) : token.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className={`text-[10px] font-medium ${token.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-sm">
                        {hideBalance ? "••••" : token.balance > 0 ? token.balance.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {hideBalance ? "••••" : token.balanceUsd > 0 ? `$${token.balanceUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav />

      <CoinDetailDialog coin={selectedCoin} onClose={() => setSelectedCoin(null)} />
    </div>
  );
}
