import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, ArrowDown, RefreshCw, Info, Zap, TrendingUp, ExternalLink, Flame } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useCoinPrices, getJupiterQuote, getSolBalance } from "@/hooks/usePrices";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { executeJupiterSwap } from "@/lib/solana-tx";
import { useTrending } from "@/hooks/useTrending";
import { Skeleton } from "@/components/ui/skeleton";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const BONK_MINT = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
const JUP_MINT  = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";
const WIF_MINT  = "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm";
const PYTH_MINT = "HZ1JovNiVvGrG6gqA4XFJQPwbsRNXFmrZLzf8xjZMm1Y";
const RAY_MINT  = "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R";

interface SwapToken {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logo: string;
  cgId?: string;
}

const TOKENS: SwapToken[] = [
  { symbol: "SOL",  name: "Solana",   mint: SOL_MINT,  decimals: 9, logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png", cgId: "solana" },
  { symbol: "USDC", name: "USD Coin", mint: USDC_MINT, decimals: 6, logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png", cgId: "usd-coin" },
  { symbol: "USDT", name: "Tether",   mint: USDT_MINT, decimals: 6, logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg", cgId: "tether" },
  { symbol: "BONK", name: "Bonk",     mint: BONK_MINT, decimals: 5, logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png" },
  { symbol: "JUP",  name: "Jupiter",  mint: JUP_MINT,  decimals: 6, logo: "https://static.jup.ag/jup/icon.png" },
  { symbol: "WIF",  name: "dogwifhat",mint: WIF_MINT,  decimals: 6, logo: "https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link" },
  { symbol: "PYTH", name: "Pyth",     mint: PYTH_MINT, decimals: 6, logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HZ1JovNiVvGrG6gqA4XFJQPwbsRNXFmrZLzf8xjZMm1Y/logo.png" },
  { symbol: "RAY",  name: "Raydium",  mint: RAY_MINT,  decimals: 6, logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png" },
];

type TrendChain = "sol" | "base" | "bnb";

function TokenLogo({ logo, symbol, size = 6 }: { logo: string; symbol: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!logo || err) {
    return (
      <div className={`w-${size} h-${size} rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0`}>
        {symbol.slice(0, 2)}
      </div>
    );
  }
  return (
    <img
      src={logo}
      alt={symbol}
      className={`w-${size} h-${size} rounded-full object-contain shrink-0`}
      onError={() => setErr(true)}
    />
  );
}

function TrendingSection() {
  const [chain, setChain] = useState<TrendChain>("sol");
  const { data, loading } = useTrending(chain);

  const chainLabels: { id: TrendChain; label: string; color: string }[] = [
    { id: "sol",  label: "Solana", color: "#14F195" },
    { id: "base", label: "Base",   color: "#0052FF" },
    { id: "bnb",  label: "BNB",    color: "#F3BA2F" },
  ];

  return (
    <div className="mt-6 mb-2">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="font-bold text-sm">Trending Now</span>
        <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground ml-auto">via GeckoTerminal</span>
      </div>

      {/* Chain tabs */}
      <div className="flex gap-1.5 mb-3">
        {chainLabels.map(c => (
          <button
            key={c.id}
            onClick={() => setChain(c.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              chain === c.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
            {c.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border-b border-border/30 last:border-0">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-20 mb-1" />
                <Skeleton className="h-2.5 w-14" />
              </div>
              <div className="text-right">
                <Skeleton className="h-3.5 w-16 mb-1 ml-auto" />
                <Skeleton className="h-2.5 w-10 ml-auto" />
              </div>
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No data available</div>
        ) : (
          data.map((pool, i) => {
            const price = parseFloat(pool.priceUsd);
            const priceStr = price === 0 ? "—" : price < 0.000001 ? price.toExponential(2) : price < 0.01 ? price.toPrecision(4) : `$${price.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
            const volStr = pool.volume24h >= 1_000_000
              ? `$${(pool.volume24h / 1_000_000).toFixed(1)}M`
              : pool.volume24h >= 1000
              ? `$${(pool.volume24h / 1000).toFixed(1)}K`
              : `$${pool.volume24h.toFixed(0)}`;

            return (
              <a
                key={pool.address + i}
                href={pool.dexUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 border-b border-border/30 last:border-0 hover:bg-black/20 transition-colors"
              >
                <div className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}</div>
                {pool.logo ? (
                  <img
                    src={pool.logo}
                    alt={pool.symbol}
                    className="w-8 h-8 rounded-full object-contain shrink-0 border border-border/50"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {pool.symbol.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs truncate">{pool.symbol}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                  </div>
                  <div className="text-[10px] text-muted-foreground">Vol: {volStr}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold">{priceStr}</div>
                  <div className={`text-[10px] font-semibold ${pool.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {pool.change24h >= 0 ? "+" : ""}{pool.change24h.toFixed(2)}%
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Swap() {
  const { data: prices } = useCoinPrices();
  const { toast } = useToast();
  const isDesktop = useIsDesktop();
  const { activeWallet, getSolKeypair, isLocked } = useWallet();

  const [fromToken, setFromToken] = useState<SwapToken>(TOKENS[0]);
  const [toToken, setToToken] = useState<SwapToken>(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [quote, setQuote] = useState<unknown>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [showTokenPicker, setShowTokenPicker] = useState<"from" | "to" | null>(null);

  const priceMap: Record<string, number> = {};
  if (prices) for (const p of prices) priceMap[p.symbol.toUpperCase()] = p.current_price ?? 0;

  const fromPrice = priceMap[fromToken.symbol] ?? 0;
  const toPrice = priceMap[toToken.symbol] ?? 1;

  useEffect(() => {
    if (activeWallet?.solAddress) getSolBalance(activeWallet.solAddress).then(setSolBalance);
  }, [activeWallet?.solAddress]);

  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) { setQuote(null); return; }
    const timer = setTimeout(async () => {
      setLoadingQuote(true);
      try {
        const amountIn = Math.floor(parseFloat(fromAmount) * Math.pow(10, fromToken.decimals));
        const q = await getJupiterQuote(fromToken.mint, toToken.mint, amountIn, Math.floor(slippage * 100));
        setQuote(q);
      } catch { setQuote(null); }
      finally { setLoadingQuote(false); }
    }, 700);
    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken, slippage]);

  const q = quote as { outAmount?: string; priceImpactPct?: number } | null;
  const toAmount = q
    ? (Number(q.outAmount) / Math.pow(10, toToken.decimals)).toFixed(toToken.decimals === 6 ? 4 : 6)
    : fromAmount && fromPrice && toPrice
    ? ((parseFloat(fromAmount) * fromPrice) / toPrice).toFixed(4)
    : "";

  const swapTokens = () => {
    const tmp = fromToken;
    setFromToken(toToken);
    setToToken(tmp);
    setFromAmount(toAmount);
    setQuote(null);
  };

  const handleExecuteSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !quote) return;
    if (isLocked || !activeWallet) {
      toast({ title: "Wallet Locked", description: "Please unlock your wallet first.", variant: "destructive" });
      return;
    }
    setExecuting(true);
    try {
      const keypair = await getSolKeypair();
      if (!keypair) throw new Error("Could not derive Solana keypair");
      const sig = await executeJupiterSwap(quote, keypair.pubKey, keypair.privKey);
      toast({
        title: "Swap Executed ✅",
        description: `${fromAmount} ${fromToken.symbol} → ~${toAmount} ${toToken.symbol}. TX: ${sig.slice(0, 8)}...`,
      });
      setFromAmount("");
      setQuote(null);
      if (activeWallet?.solAddress) getSolBalance(activeWallet.solAddress).then(setSolBalance);
    } catch (err: unknown) {
      toast({ title: "Swap Failed ❌", description: (err as Error).message ?? "Swap failed.", variant: "destructive" });
    } finally { setExecuting(false); }
  };

  const TokenBadge = ({ token, side }: { token: SwapToken; side: "from" | "to" }) => (
    <button
      onClick={() => setShowTokenPicker(showTokenPicker === side ? null : side)}
      className="flex items-center gap-2 bg-black/40 border border-border rounded-full py-1.5 px-3 ml-auto cursor-pointer hover:bg-black/60 transition-colors"
    >
      <TokenLogo logo={token.logo} symbol={token.symbol} size={5} />
      <span className="font-bold text-sm">{token.symbol}</span>
      <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  const TokenPicker = ({ side }: { side: "from" | "to" }) => {
    const current = side === "from" ? fromToken : toToken;
    const other = side === "from" ? toToken : fromToken;
    return (
      <div className="absolute z-50 top-full right-0 mt-1 bg-card border border-border rounded-2xl overflow-hidden shadow-2xl w-52">
        {TOKENS.filter(t => t.symbol !== other.symbol).map(t => (
          <button
            key={t.mint}
            onClick={() => {
              if (side === "from") setFromToken(t); else setToToken(t);
              setShowTokenPicker(null);
              setQuote(null);
            }}
            className={`w-full flex items-center gap-3 p-3 hover:bg-black/20 transition-colors border-b border-border/30 last:border-0 ${t.symbol === current.symbol ? "bg-primary/10" : ""}`}
          >
            <TokenLogo logo={t.logo} symbol={t.symbol} size={7} />
            <div className="text-left">
              <div className="text-sm font-bold">{t.symbol}</div>
              <div className="text-[10px] text-muted-foreground">{t.name}</div>
            </div>
            {t.symbol === current.symbol && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative bg-background`}
      onClick={() => showTokenPicker && setShowTokenPicker(null)}
    >
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {isDesktop ? <h1 className="text-xl font-bold">Swap</h1> : (
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card"><ArrowLeft className="w-5 h-5" /></Link>
        )}
        {!isDesktop && <h1 className="text-lg font-bold">Swap</h1>}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-full border border-border">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Jupiter
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 ${isDesktop ? "pb-8 max-w-lg" : "pb-24"}`}>
        {activeWallet?.solAddress && (
          <div className="mb-3 text-xs text-muted-foreground text-right">
            SOL balance: <span className="text-foreground font-medium">{solBalance.toFixed(4)} SOL</span>
          </div>
        )}

        {/* Slippage */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground">Slippage:</span>
          {[0.1, 0.5, 1.0, 3.0].map(s => (
            <button key={s} onClick={() => setSlippage(s)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors font-bold ${slippage === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
              {s}%
            </button>
          ))}
        </div>

        {/* From */}
        <div className="bg-card rounded-3xl p-4 border border-border relative mb-1" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">From</span>
            <span className="text-xs text-muted-foreground">~${fromAmount && fromPrice ? (parseFloat(fromAmount) * fromPrice).toFixed(2) : "0.00"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Input type="number" placeholder="0.0" value={fromAmount} onChange={e => setFromAmount(e.target.value)}
              className="text-3xl font-bold border-none bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 w-1/2" />
            <div className="relative">
              <TokenBadge token={fromToken} side="from" />
              {showTokenPicker === "from" && <TokenPicker side="from" />}
            </div>
          </div>
          <div className="flex gap-1 mt-3">
            {["25%", "50%", "75%", "MAX"].map((pct, i) => {
              const mult = [0.25, 0.5, 0.75, 1][i];
              return (
                <button key={pct} onClick={() => {
                  if (fromToken.symbol === "SOL") setFromAmount(Math.max(0, solBalance * mult - 0.001).toFixed(4));
                }}
                  className="text-[10px] px-2 py-0.5 rounded bg-black/30 border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors">
                  {pct}
                </button>
              );
            })}
          </div>
        </div>

        {/* Switch */}
        <div className="flex justify-center -my-5 relative z-10">
          <button onClick={swapTokens}
            className="w-10 h-10 bg-background border-4 border-background rounded-full flex items-center justify-center hover:rotate-180 transition-transform duration-300">
            <div className="w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center text-primary">
              <ArrowDown className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* To */}
        <div className="bg-card rounded-3xl p-4 border border-border mb-4 relative" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">To</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {loadingQuote && <RefreshCw className="w-3 h-3 animate-spin" />}
              <span>{q ? "Jupiter quote ✓" : "estimated"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Input type="number" placeholder="0.0" value={toAmount} readOnly
              className="text-3xl font-bold border-none bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 w-1/2 text-muted-foreground" />
            <div className="relative">
              <TokenBadge token={toToken} side="to" />
              {showTokenPicker === "to" && <TokenPicker side="to" />}
            </div>
          </div>
        </div>

        {/* Info */}
        {fromAmount && parseFloat(fromAmount) > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-medium">1 {fromToken.symbol} ≈ {(fromPrice / (toPrice || 1)).toFixed(4)} {toToken.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Slippage</span>
              <span className="font-medium">{slippage}%</span>
            </div>
            {q && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={`font-medium ${(q.priceImpactPct ?? 0) > 1 ? "text-red-500" : "text-green-500"}`}>
                  {((q.priceImpactPct ?? 0) * 100).toFixed(3)}%
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
              <Info className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">Best route across all Solana DEXes via Jupiter</span>
            </div>
          </div>
        )}

        <Button className="w-full h-14 rounded-2xl text-lg font-bold"
          disabled={!fromAmount || parseFloat(fromAmount) <= 0 || loadingQuote || executing || !q}
          onClick={handleExecuteSwap}>
          {executing ? <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" />Executing...</span>
            : loadingQuote ? "Getting best route..."
            : q ? <span className="flex items-center gap-2"><Zap className="w-5 h-5" />Execute Swap</span>
            : "Enter amount to get quote"}
        </Button>

        {isLocked && <p className="text-center text-xs text-amber-500 mt-2">⚠️ Wallet locked — unlock to execute swaps</p>}

        {/* Trending Section */}
        <TrendingSection />
      </div>

      <BottomNav />
    </div>
  );
}
