import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, ArrowDown, RefreshCw, Info, Zap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useCoinPrices, getJupiterQuote, getSolBalance } from "@/hooks/usePrices";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { executeJupiterSwap } from "@/lib/solana-tx";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const BONK_MINT = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
const JUP_MINT = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";
const WIF_MINT = "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm";

interface SwapToken {
  symbol: string;
  mint: string;
  decimals: number;
  color: string;
}

const TOKENS: SwapToken[] = [
  { symbol: "SOL", mint: SOL_MINT, decimals: 9, color: "#14F195" },
  { symbol: "USDC", mint: USDC_MINT, decimals: 6, color: "#2775CA" },
  { symbol: "USDT", mint: USDT_MINT, decimals: 6, color: "#26A17B" },
  { symbol: "BONK", mint: BONK_MINT, decimals: 5, color: "#F7931A" },
  { symbol: "JUP", mint: JUP_MINT, decimals: 6, color: "#C57BFF" },
  { symbol: "WIF", mint: WIF_MINT, decimals: 6, color: "#FF6B6B" },
];

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
  if (prices) for (const p of prices) priceMap[p.symbol.toUpperCase()] = p.current_price;

  const fromPrice = priceMap[fromToken.symbol] ?? 0;
  const toPrice = priceMap[toToken.symbol] ?? 1;

  useEffect(() => {
    if (activeWallet?.solAddress) {
      getSolBalance(activeWallet.solAddress).then(setSolBalance);
    }
  }, [activeWallet?.solAddress]);

  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) { setQuote(null); return; }
    const timer = setTimeout(async () => {
      setLoadingQuote(true);
      try {
        const amountIn = Math.floor(parseFloat(fromAmount) * Math.pow(10, fromToken.decimals));
        const q = await getJupiterQuote(fromToken.mint, toToken.mint, amountIn, Math.floor(slippage * 100));
        setQuote(q);
      } catch {
        setQuote(null);
      } finally {
        setLoadingQuote(false);
      }
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
        description: (
          <span>
            {fromAmount} {fromToken.symbol} → ~{toAmount} {toToken.symbol}.{" "}
            <a
              href={`https://solscan.io/tx/${sig}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary"
            >
              View TX
            </a>
          </span>
        ) as unknown as string,
      });

      setFromAmount("");
      setQuote(null);
      if (activeWallet?.solAddress) {
        getSolBalance(activeWallet.solAddress).then(setSolBalance);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Swap failed.";
      toast({ title: "Swap Failed ❌", description: msg, variant: "destructive" });
    } finally {
      setExecuting(false);
    }
  };

  const TokenBadge = ({ token, side }: { token: SwapToken; side: "from" | "to" }) => (
    <button
      onClick={() => setShowTokenPicker(showTokenPicker === side ? null : side)}
      className="flex items-center gap-2 bg-black/40 border border-border rounded-full py-1.5 px-3 ml-auto cursor-pointer hover:bg-black/60 transition-colors"
    >
      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: token.color }} />
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
      <div className="absolute z-50 top-full right-0 mt-1 bg-card border border-border rounded-2xl overflow-hidden shadow-2xl w-40">
        {TOKENS.filter(t => t.symbol !== other.symbol).map(t => (
          <button
            key={t.mint}
            onClick={() => {
              if (side === "from") setFromToken(t);
              else setToToken(t);
              setShowTokenPicker(null);
              setQuote(null);
            }}
            className={`w-full flex items-center gap-2 p-3 hover:bg-black/20 transition-colors border-b border-border/30 last:border-0 ${t.symbol === current.symbol ? "bg-primary/10" : ""}`}
          >
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="text-sm font-bold">{t.symbol}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative bg-background`}
      onClick={() => showTokenPicker && setShowTokenPicker(null)}>
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {isDesktop ? (
          <h1 className="text-xl font-bold">Swap</h1>
        ) : (
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        {!isDesktop && <h1 className="text-lg font-bold">Swap</h1>}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-full border border-border">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Jupiter
          </div>
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
            <button
              key={s}
              onClick={() => setSlippage(s)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors font-bold ${slippage === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
            >
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
            <Input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={e => setFromAmount(e.target.value)}
              className="text-3xl font-bold border-none bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 w-1/2"
            />
            <div className="relative">
              <TokenBadge token={fromToken} side="from" />
              {showTokenPicker === "from" && <TokenPicker side="from" />}
            </div>
          </div>
          <div className="flex gap-1 mt-3">
            {["25%", "50%", "75%", "MAX"].map((pct, i) => {
              const mult = [0.25, 0.5, 0.75, 1][i];
              return (
                <button
                  key={pct}
                  onClick={() => {
                    if (fromToken.symbol === "SOL") setFromAmount(Math.max(0, solBalance * mult - 0.001).toFixed(4));
                  }}
                  className="text-[10px] px-2 py-0.5 rounded bg-black/30 border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors"
                >
                  {pct}
                </button>
              );
            })}
          </div>
        </div>

        {/* Switch */}
        <div className="flex justify-center -my-5 relative z-10">
          <button
            onClick={swapTokens}
            className="w-10 h-10 bg-background border-4 border-background rounded-full flex items-center justify-center hover:rotate-180 transition-transform duration-300"
          >
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
            <Input
              type="number"
              placeholder="0.0"
              value={toAmount}
              readOnly
              className="text-3xl font-bold border-none bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 w-1/2 text-muted-foreground"
            />
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

        <Button
          className="w-full h-14 rounded-2xl text-lg font-bold"
          disabled={!fromAmount || parseFloat(fromAmount) <= 0 || loadingQuote || executing || !q}
          onClick={handleExecuteSwap}
        >
          {executing ? (
            <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" />Executing Swap...</span>
          ) : loadingQuote ? (
            "Getting best route..."
          ) : q ? (
            <span className="flex items-center gap-2"><Zap className="w-5 h-5" />Execute Swap</span>
          ) : (
            "Enter amount to get quote"
          )}
        </Button>

        {isLocked && (
          <p className="text-center text-xs text-amber-500 mt-2">⚠️ Wallet locked — unlock to execute swaps</p>
        )}
        {!isLocked && !activeWallet?.solAddress && (
          <p className="text-center text-xs text-muted-foreground mt-2">Swaps use your Solana wallet</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
