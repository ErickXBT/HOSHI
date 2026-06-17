import { useState, useEffect } from "react";
import { X, ArrowUpRight, ArrowDownLeft, ExternalLink, BarChart2, Clock, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface CoinDialogData {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  chain?: string;
  walletEvmAddress?: string;
  walletSolAddress?: string;
}

export function Sparkline({ prices }: { prices: number[] }) {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 300, H = 90;
  const pts = prices.map((p, i) => [
    (i / (prices.length - 1)) * W,
    H - ((p - min) / range) * (H - 12) - 6,
  ]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${path} L${W},${H} L0,${H} Z`;
  const last = prices[prices.length - 1];
  const first = prices[0];
  const isUp = last >= first;
  const color = isUp ? "#22c55e" : "#ef4444";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 90 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function fmt(n: number) {
  return n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${n.toFixed(2)}`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hrs  > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

interface TxItem {
  hash: string;
  type: "send" | "receive";
  amount: string;
  symbol: string;
  timestamp: number;
  status: "confirmed" | "failed";
  to?: string;
  from?: string;
}

const EXPLORERS: Record<string, string> = {
  eth: "https://etherscan.io/tx/",
  bnb: "https://bscscan.com/tx/",
  polygon: "https://polygonscan.com/tx/",
  sol: "https://solscan.io/tx/",
  arb: "https://arbiscan.io/tx/",
};

async function fetchEthTxs(address: string, apiBase: string, symbol: string): Promise<TxItem[]> {
  try {
    const res = await fetch(`${apiBase}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc`);
    if (!res.ok) return [];
    const data = await res.json() as { status: string; result: Array<{ hash: string; from: string; to: string; value: string; timeStamp: string; isError: string; txreceipt_status: string }> };
    if (data.status !== "1" || !Array.isArray(data.result)) return [];
    return data.result.slice(0, 8).map(tx => ({
      hash: tx.hash,
      type: tx.from.toLowerCase() === address.toLowerCase() ? "send" : "receive",
      amount: (parseInt(tx.value) / 1e18).toFixed(6),
      symbol,
      to: tx.to,
      from: tx.from,
      timestamp: parseInt(tx.timeStamp) * 1000,
      status: tx.isError === "1" ? "failed" : "confirmed",
    }));
  } catch { return []; }
}

async function fetchSolTxs(address: string): Promise<TxItem[]> {
  try {
    const sigRes = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSignaturesForAddress", params: [address, { limit: 8 }] }),
    });
    const sigData = await sigRes.json() as { result?: Array<{ signature: string; blockTime?: number; err: unknown }> };
    if (!sigData.result?.length) return [];
    const sigs = sigData.result;

    const details = await Promise.all(sigs.slice(0, 6).map(async sig => {
      try {
        const txRes = await fetch("https://api.mainnet-beta.solana.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTransaction", params: [sig.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }] }),
        });
        const txData = await txRes.json() as { result?: { meta?: { preBalances: number[]; postBalances: number[]; err: unknown }; transaction?: { message?: { accountKeys?: Array<{ pubkey?: string } | string> } } } };
        const tx = txData?.result;
        if (!tx?.meta) return null;
        const keys: string[] = (tx.transaction?.message?.accountKeys ?? []).map((k: { pubkey?: string } | string) => typeof k === "string" ? k : k.pubkey ?? "");
        const idx = keys.findIndex(k => k === address);
        if (idx < 0) return null;
        const diff = (tx.meta.postBalances[idx] ?? 0) - (tx.meta.preBalances[idx] ?? 0);
        return { amount: (Math.abs(diff) / 1e9).toFixed(6), type: diff >= 0 ? "receive" : "send" as "send" | "receive", error: !!tx.meta.err };
      } catch { return null; }
    }));

    return sigs.map((sig, i) => {
      const d = details[i];
      return {
        hash: sig.signature,
        type: d?.type ?? "send",
        amount: d?.amount ?? "—",
        symbol: "SOL",
        timestamp: (sig.blockTime ?? 0) * 1000,
        status: (sig.err || d?.error) ? "failed" : "confirmed",
      };
    });
  } catch { return []; }
}

function TxRow({ tx, chain }: { tx: TxItem; chain: string }) {
  const isReceive = tx.type === "receive";
  const explorerUrl = EXPLORERS[chain] ? EXPLORERS[chain] + tx.hash : null;
  const shortAddr = (addr?: string) => addr ? `${addr.slice(0, 5)}...${addr.slice(-4)}` : "";

  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-border/40 last:border-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isReceive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-400"}`}>
        {isReceive ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold capitalize">{tx.type}</span>
          {tx.status === "failed" && <span className="text-[9px] px-1 py-0.5 bg-red-500/10 text-red-400 rounded font-bold">FAIL</span>}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {tx.type === "send" && tx.to ? `→ ${shortAddr(tx.to)}` : tx.from ? `← ${shortAddr(tx.from)}` : ""}
          {tx.timestamp > 0 ? ` · ${timeAgo(tx.timestamp)}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-xs font-bold ${isReceive ? "text-green-500" : "text-red-400"}`}>
          {tx.amount !== "—" ? `${isReceive ? "+" : "-"}${parseFloat(tx.amount) < 0.001 ? parseFloat(tx.amount).toFixed(6) : parseFloat(tx.amount).toFixed(4)} ${tx.symbol}` : "—"}
        </span>
        {explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/50 hover:text-primary" onClick={e => e.stopPropagation()}>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

export function CoinDetailDialog({ coin, onClose }: { coin: CoinDialogData | null; onClose: () => void }) {
  const [tab, setTab] = useState<"chart" | "history">("chart");
  const [sparkline, setSparkline] = useState<number[]>([]);
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [txs, setTxs] = useState<TxItem[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txFetched, setTxFetched] = useState(false);

  const id = coin?.id ?? "";
  const chain = coin?.chain ?? "";

  useEffect(() => {
    if (!id || !coin) return;
    setTab("chart");
    setSparkline([]);
    setDetails(null);
    setTxs([]);
    setTxFetched(false);
    setChartLoading(true);
    Promise.allSettled([
      fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`)
        .then(r => r.json())
        .then(d => setSparkline(((d.prices ?? []) as [number, number][]).map(p => p[1]))),
      fetch(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`)
        .then(r => r.json())
        .then(d => setDetails(d)),
    ]).finally(() => setChartLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab !== "history" || txFetched || !coin) return;
    setTxFetched(true);
    setTxLoading(true);
    const { walletEvmAddress, walletSolAddress } = coin;
    let fetchPromise: Promise<TxItem[]> = Promise.resolve([]);

    if (chain === "eth" && walletEvmAddress) {
      fetchPromise = fetchEthTxs(walletEvmAddress, "https://api.etherscan.io/api", "ETH");
    } else if (chain === "sol" && walletSolAddress) {
      fetchPromise = fetchSolTxs(walletSolAddress);
    } else if (chain === "bnb" && walletEvmAddress) {
      fetchPromise = fetchEthTxs(walletEvmAddress, "https://api.bscscan.com/api", "BNB");
    } else if (chain === "polygon" && walletEvmAddress) {
      fetchPromise = fetchEthTxs(walletEvmAddress, "https://api.polygonscan.com/api", "MATIC");
    } else if (chain === "arb" && walletEvmAddress) {
      fetchPromise = fetchEthTxs(walletEvmAddress, "https://arbiscan.io/api", "ETH");
    }

    fetchPromise.then(setTxs).finally(() => setTxLoading(false));
  }, [tab, txFetched, coin, chain]);

  const mktCap = coin?.marketCap ?? ((details?.market_data as Record<string, unknown>)?.market_cap as Record<string, number>)?.usd ?? 0;
  const vol24h = coin?.volume24h ?? ((details?.market_data as Record<string, unknown>)?.total_volume as Record<string, number>)?.usd ?? 0;
  const desc: string = (((details?.description as Record<string, string>)?.en ?? "")).replace(/<[^>]+>/g, "").slice(0, 200);
  const price = coin?.price ?? 0;
  const change24h = coin?.change24h ?? 0;

  if (!coin) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-sm w-full bg-card border border-border md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            {coin.image
              ? <img src={coin.image} alt={coin.symbol} className="w-9 h-9 rounded-full border border-border object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              : <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{coin.symbol[0]}</div>
            }
            <div>
              <p className="font-bold">{coin.symbol.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">{coin.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/20 text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price */}
        <div className="px-4 pt-3 pb-2">
          <div className="text-2xl font-bold">
            {price > 0 ? `$${price < 0.01 ? price.toPrecision(4) : price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          </div>
          <div className={`text-xs font-semibold flex items-center gap-1 mt-0.5 ${change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
            {change24h >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
            {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}% (24h)
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 border-b border-border mb-0">
          {(["chart", "history"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-bold capitalize border-b-2 transition-colors ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t === "chart" ? "📈 Chart" : "🕐 History"}
            </button>
          ))}
        </div>

        {tab === "chart" && (
          <div>
            <div className="px-4 py-2">
              {chartLoading ? <Skeleton className="h-[90px] w-full rounded-xl" /> : <Sparkline prices={sparkline} />}
              {!chartLoading && sparkline.length > 0 && <p className="text-[10px] text-muted-foreground text-right mt-0.5">7-day price chart</p>}
            </div>
            <div className="grid grid-cols-2 gap-2 px-4 pb-3">
              {[
                { label: "Market Cap", value: mktCap > 0 ? fmt(mktCap) : "—" },
                { label: "24h Volume", value: vol24h > 0 ? fmt(vol24h) : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-background rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                  <p className="font-bold text-sm">{value}</p>
                </div>
              ))}
            </div>
            {desc && <p className="text-xs text-muted-foreground px-4 pb-3 leading-relaxed line-clamp-3">{desc}…</p>}
            <div className="px-4 pb-4">
              <a
                href={`https://www.coingecko.com/en/coins/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-bold hover:bg-primary/10 transition-colors"
              >
                <BarChart2 className="w-4 h-4" />
                View Full Chart on CoinGecko
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="px-4 py-3 max-h-72 overflow-y-auto">
            {txLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-2">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <div className="flex-1"><Skeleton className="h-3 w-20 mb-1" /><Skeleton className="h-2.5 w-28" /></div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : txs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                {(chain === "btc" || !chain || (!coin.walletEvmAddress && !coin.walletSolAddress)) ? (
                  <>
                    <Clock className="w-8 h-8 text-muted-foreground/20 mb-2" />
                    <p className="text-sm font-semibold">No history available</p>
                    <p className="text-xs text-muted-foreground mt-1">Transaction history is not supported for this asset.</p>
                  </>
                ) : (
                  <>
                    <Clock className="w-8 h-8 text-muted-foreground/20 mb-2" />
                    <p className="text-sm font-semibold">No transactions found</p>
                    <p className="text-xs text-muted-foreground mt-1">No {coin.symbol.toUpperCase()} transactions on this wallet yet.</p>
                  </>
                )}
              </div>
            ) : (
              <div>
                {txs.map(tx => <TxRow key={tx.hash} tx={tx} chain={chain} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
