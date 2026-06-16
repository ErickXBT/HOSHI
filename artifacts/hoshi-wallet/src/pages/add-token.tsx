import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, Search, ExternalLink, Plus, X, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCoinPrices } from "@/hooks/usePrices";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import {
  useEnabledTokens,
  loadCustomTokens,
  saveCustomTokens,
  lookupTokenByCA,
  type CustomToken,
} from "@/hooks/useTokens";

function chainLabel(chainId: string): string {
  const map: Record<string, string> = {
    ethereum: "ETH", solana: "SOL", bsc: "BNB", polygon: "MATIC",
    arbitrum: "ARB", base: "BASE", optimism: "OP",
  };
  return map[chainId] ?? chainId.toUpperCase().slice(0, 4);
}

export default function AddToken() {
  const { data: coins, isLoading } = useCoinPrices();
  const [search, setSearch] = useState("");
  const { enabled, setEnabled } = useEnabledTokens();
  const [customTokens, setCustomTokens] = useState<CustomToken[]>(loadCustomTokens);
  const [caInput, setCaInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<CustomToken | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [tab, setTab] = useState<"popular" | "custom">("popular");
  const isDesktop = useIsDesktop();
  const { toast } = useToast();

  const filtered = (coins ?? []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const handleCALookup = async () => {
    const ca = caInput.trim();
    if (!ca) return;
    setLookingUp(true);
    setLookupResult(null);
    setLookupError("");
    const result = await lookupTokenByCA(ca);
    setLookingUp(false);
    if (result) {
      setLookupResult(result);
    } else {
      setLookupError("Token not found. Make sure the contract address is correct.");
    }
  };

  const handleAddCustomToken = () => {
    if (!lookupResult) return;
    const already = customTokens.find(t => t.address.toLowerCase() === lookupResult.address.toLowerCase());
    if (already) {
      toast({ title: "Already added", description: `${lookupResult.symbol} is already in your list` });
      return;
    }
    const updated = [...customTokens, lookupResult];
    setCustomTokens(updated);
    saveCustomTokens(updated);
    setEnabled(lookupResult.id, true);
    setCaInput("");
    setLookupResult(null);
    toast({ title: `${lookupResult.symbol} Added ✅`, description: `${lookupResult.name} added to your watchlist` });
  };

  const handleRemoveCustomToken = (token: CustomToken) => {
    const updated = customTokens.filter(t => t.id !== token.id);
    setCustomTokens(updated);
    saveCustomTokens(updated);
    setEnabled(token.id, false);
  };

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative bg-background`}>
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {isDesktop ? <h1 className="text-xl font-bold">Manage Assets</h1> : (
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card"><ArrowLeft className="w-5 h-5" /></Link>
        )}
        {!isDesktop && <h1 className="text-lg font-bold">Manage Assets</h1>}
        <div className="w-9" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-3 border-b border-border bg-background/80 backdrop-blur-md sticky top-[57px] z-10">
        {(["popular", "custom"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "popular" ? "Popular Tokens" : "Custom (CA Lookup)"}
          </button>
        ))}
      </div>

      {tab === "popular" ? (
        <>
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search token name or symbol..."
                className="pl-10 bg-card border-border h-12 rounded-xl"
              />
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto p-4 ${isDesktop ? "pb-8" : "pb-24"} space-y-1`}>
            {isLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-3 w-24" /></div>
                  </div>
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
              ))
            ) : (
              filtered.map(coin => (
                <div key={coin.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black/40 border border-border flex items-center justify-center overflow-hidden">
                      <img src={coin.image} alt={coin.symbol} className="w-7 h-7 object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{coin.symbol.toUpperCase()}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-card border border-border rounded font-bold uppercase tracking-wider text-muted-foreground">
                          {coin.id.includes("solana") ? "SOL" : "EVM"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{coin.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-medium">
                        ${coin.current_price < 0.01 ? coin.current_price.toPrecision(3) : coin.current_price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </div>
                      <div className={`text-[10px] ${coin.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {coin.price_change_percentage_24h >= 0 ? "+" : ""}{coin.price_change_percentage_24h.toFixed(2)}%
                      </div>
                    </div>
                    <Switch
                      checked={enabled[coin.id] ?? false}
                      onCheckedChange={c => setEnabled(coin.id, c)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              ))
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No tokens found for "{search}"</p>
                <Button variant="outline" size="sm" className="mt-4 border-primary/30 text-primary hover:bg-primary/10" asChild>
                  <a href={`https://www.coingecko.com/en/search?query=${search}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Search on CoinGecko
                  </a>
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={`flex-1 overflow-y-auto p-4 ${isDesktop ? "pb-8" : "pb-24"} space-y-4`}>

          {/* CA Input */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Contract Address (CA)
              </label>
              <div className="flex gap-2">
                <Input
                  value={caInput}
                  onChange={e => { setCaInput(e.target.value); setLookupResult(null); setLookupError(""); }}
                  placeholder="0x... or Solana mint address..."
                  className="bg-background border-border h-12 rounded-xl font-mono text-xs"
                  onKeyDown={e => e.key === "Enter" && handleCALookup()}
                />
                <Button onClick={handleCALookup} disabled={!caInput.trim() || lookingUp} className="h-12 px-4 rounded-xl shrink-0">
                  {lookingUp ? <Search className="w-4 h-4 animate-pulse" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                ETH / BSC / Polygon / Solana / Base / Arbitrum · Powered by DexScreener
              </p>
            </div>

            {lookupError && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-400">{lookupError}</p>
              </div>
            )}

            {lookupResult && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  {lookupResult.logo ? (
                    <img src={lookupResult.logo} alt={lookupResult.symbol} className="w-10 h-10 rounded-full border border-border object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                      {lookupResult.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{lookupResult.symbol}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-card border border-border rounded font-bold uppercase tracking-wider text-muted-foreground">
                        {chainLabel(lookupResult.chain)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{lookupResult.name}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-sm font-bold">
                      ${lookupResult.price < 0.0001 ? lookupResult.price.toExponential(2) : lookupResult.price.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                    </div>
                    <div className={`text-xs ${lookupResult.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {lookupResult.change24h >= 0 ? "+" : ""}{lookupResult.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">{lookupResult.address}</div>
                <Button onClick={handleAddCustomToken} className="w-full h-10 rounded-xl font-bold">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Add {lookupResult.symbol} to Watchlist
                </Button>
              </div>
            )}
          </div>

          {/* Custom tokens list */}
          {customTokens.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Custom Tokens</h3>
              <div className="space-y-2">
                {customTokens.map(token => (
                  <div key={token.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      {token.logo ? (
                        <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full border border-border object-contain" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-black/40 border border-border flex items-center justify-center text-[10px] font-bold">
                          {token.symbol.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">{token.symbol}</span>
                          <span className="text-[9px] px-1 py-0.5 bg-black/40 border border-border/50 rounded font-bold uppercase text-muted-foreground">
                            {chainLabel(token.chain)}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{token.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={enabled[token.id] ?? true}
                        onCheckedChange={c => setEnabled(token.id, c)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <button
                        onClick={() => handleRemoveCustomToken(token)}
                        className="p-1.5 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customTokens.length === 0 && !lookupResult && (
            <div className="text-center py-16">
              <Plus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Paste any contract address above</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Supports ETH, BSC, Polygon, Solana, Base, Arbitrum & more</p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
