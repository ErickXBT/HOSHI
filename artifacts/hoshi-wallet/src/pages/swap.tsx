import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, ArrowDown, RefreshCw, Info } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useCoinPrices, getJupiterQuote } from "@/hooks/usePrices";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

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
];

export default function Swap() {
  const { data: prices } = useCoinPrices();
  const { toast } = useToast();
  const isDesktop = useIsDesktop();

  const [fromToken, setFromToken] = useState<SwapToken>(TOKENS[0]);
  const [toToken, setToToken] = useState<SwapToken>(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [slippage] = useState(0.5);

  const priceMap: Record<string, number> = {};
  if (prices) for (const p of prices) priceMap[p.symbol.toUpperCase()] = p.current_price;

  const fromPrice = priceMap[fromToken.symbol] ?? 0;
  const toPrice = priceMap[toToken.symbol] ?? 1;

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

  const toAmount = quote
    ? (Number(quote.outAmount) / Math.pow(10, toToken.decimals)).toFixed(toToken.decimals === 6 ? 4 : 6)
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

  const handleReviewSwap = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    toast({
      title: "Swap via Jupiter",
      description: `Swapping ${fromAmount} ${fromToken.symbol} → ~${toAmount} ${toToken.symbol}. Full execution coming soon — connects Phantom/Backpack.`,
    });
  };

  const TokenBadge = ({ token }: { token: SwapToken }) => (
    <div className="flex items-center gap-2 bg-black/40 border border-border rounded-full py-1.5 px-3 ml-auto cursor-pointer hover:bg-black/60">
      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: token.color }} />
      <span className="font-bold text-sm">{token.symbol}</span>
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative bg-background`}>
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {isDesktop ? (
          <h1 className="text-xl font-bold">Swap</h1>
        ) : (
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        {!isDesktop && <h1 className="text-lg font-bold">Swap</h1>}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-full border border-border">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          Jupiter
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 ${isDesktop ? "pb-8 max-w-lg" : "pb-24"}`}>
        {/* From */}
        <div className="bg-card rounded-3xl p-4 border border-border relative mb-1">
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
            <div onClick={() => {
              const next = TOKENS.filter(t => t.symbol !== toToken.symbol);
              setFromToken(next[0] === fromToken ? next[1] ?? TOKENS[0] : next[0]);
            }}>
              <TokenBadge token={fromToken} />
            </div>
          </div>
          <div className="flex gap-1 mt-3">
            {["25%", "50%", "75%", "MAX"].map((pct) => (
              <button key={pct} className="text-[10px] px-2 py-0.5 rounded bg-black/30 border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors">
                {pct}
              </button>
            ))}
          </div>
        </div>

        {/* Switch */}
        <div className="flex justify-center -my-5 relative z-10">
          <button onClick={swapTokens} className="w-10 h-10 bg-background border-4 border-background rounded-full flex items-center justify-center hover:rotate-180 transition-transform duration-300">
            <div className="w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center text-primary">
              <ArrowDown className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* To */}
        <div className="bg-card rounded-3xl p-4 border border-border mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">To</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {loadingQuote && <RefreshCw className="w-3 h-3 animate-spin" />}
              <span>{quote ? "Jupiter quote" : "estimated"}</span>
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
            <div onClick={() => {
              const next = TOKENS.filter(t => t.symbol !== fromToken.symbol);
              setToToken(next[0] === toToken ? next[1] ?? TOKENS[1] : next[0]);
            }}>
              <TokenBadge token={toToken} />
            </div>
          </div>
        </div>

        {/* Info */}
        {fromAmount && parseFloat(fromAmount) > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-medium">1 {fromToken.symbol} ≈ {(fromPrice / toPrice).toFixed(4)} {toToken.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Slippage</span>
              <span className="font-medium">{slippage}%</span>
            </div>
            {quote && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={`font-medium ${(quote.priceImpactPct ?? 0) > 1 ? "text-red-500" : "text-green-500"}`}>
                  {((quote.priceImpactPct ?? 0) * 100).toFixed(3)}%
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
              <Info className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">Powered by Jupiter aggregator — best route across Solana DEXes</span>
            </div>
          </div>
        )}

        <Button
          className="w-full h-14 rounded-2xl text-lg font-bold"
          disabled={!fromAmount || parseFloat(fromAmount) <= 0}
          onClick={handleReviewSwap}
        >
          {loadingQuote ? "Getting best route..." : "Review Swap"}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
