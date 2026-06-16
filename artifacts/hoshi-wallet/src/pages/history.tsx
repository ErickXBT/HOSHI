import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink, Clock } from "lucide-react";
import { Link } from "wouter";
import { useWallet } from "@/hooks/useWallet";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface TxRecord {
  hash: string;
  type: "send" | "receive" | "swap";
  chain: string;
  amount: string;
  symbol: string;
  to?: string;
  from?: string;
  timestamp: number;
  status: "confirmed" | "pending" | "failed";
  usdValue?: number;
}

const CHAIN_EXPLORERS: Record<string, string> = {
  eth: "https://etherscan.io/tx/",
  bnb: "https://bscscan.com/tx/",
  polygon: "https://polygonscan.com/tx/",
  sol: "https://solscan.io/tx/",
  arb: "https://arbiscan.io/tx/",
  base: "https://basescan.org/tx/",
};

async function fetchEthTransactions(address: string): Promise<TxRecord[]> {
  try {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=YourApiKeyToken`;
    const res = await fetch(url);
    const data = await res.json() as { status: string; result: Array<{
      hash: string;
      from: string;
      to: string;
      value: string;
      timeStamp: string;
      txreceipt_status: string;
    }> };
    if (data.status !== "1" || !Array.isArray(data.result)) return [];
    return data.result.slice(0, 15).map(tx => ({
      hash: tx.hash,
      type: tx.from.toLowerCase() === address.toLowerCase() ? "send" : "receive",
      chain: "eth",
      amount: (parseInt(tx.value) / 1e18).toFixed(6),
      symbol: "ETH",
      to: tx.to,
      from: tx.from,
      timestamp: parseInt(tx.timeStamp) * 1000,
      status: tx.txreceipt_status === "1" ? "confirmed" : tx.txreceipt_status === "0" ? "failed" : "pending",
    }));
  } catch {
    return [];
  }
}

async function fetchSolTransactions(address: string): Promise<TxRecord[]> {
  try {
    const res = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [address, { limit: 15 }],
      }),
    });
    const data = await res.json() as { result?: Array<{
      signature: string;
      blockTime?: number;
      err: unknown;
      confirmationStatus: string;
    }> };
    if (!data.result) return [];
    return data.result.map(sig => ({
      hash: sig.signature,
      type: "send" as const,
      chain: "sol",
      amount: "—",
      symbol: "SOL",
      timestamp: (sig.blockTime ?? 0) * 1000,
      status: sig.err ? "failed" : "confirmed" as const,
    }));
  } catch {
    return [];
  }
}

function shortAddr(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

const TYPE_ICONS = {
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  swap: RefreshCw,
};

const TYPE_COLORS = {
  send: "text-red-500 bg-red-500/10",
  receive: "text-green-500 bg-green-500/10",
  swap: "text-primary bg-primary/10",
};

export default function History() {
  const { activeWallet } = useWallet();
  const isDesktop = useIsDesktop();
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "send" | "receive" | "swap">("all");

  useEffect(() => {
    if (!activeWallet) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetchEthTransactions(activeWallet.evmAddress),
      fetchSolTransactions(activeWallet.solAddress),
    ]).then(([eth, sol]) => {
      const all = [...eth, ...sol].sort((a, b) => b.timestamp - a.timestamp);
      setTxs(all);
      setLoading(false);
    });
  }, [activeWallet?.evmAddress, activeWallet?.solAddress]);

  const filtered = filter === "all" ? txs : txs.filter(t => t.type === filter);

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative bg-background`}>
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {isDesktop ? <h1 className="text-xl font-bold">Transaction History</h1> : (
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card"><ArrowLeft className="w-5 h-5" /></Link>
        )}
        {!isDesktop && <h1 className="text-lg font-bold">History</h1>}
        <div className="w-9" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 p-3 border-b border-border overflow-x-auto scrollbar-hide">
        {(["all", "send", "receive", "swap"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize shrink-0 transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className={`flex-1 overflow-y-auto p-4 ${isDesktop ? "pb-8 max-w-2xl" : "pb-24"} space-y-2`}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1.5" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-16 mb-1.5 ml-auto" />
                <Skeleton className="h-3 w-10 ml-auto" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-bold text-lg mb-2">No Transactions</h3>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              {txs.length === 0
                ? "Your transaction history will appear here once you start using your wallet."
                : `No ${filter} transactions found.`}
            </p>
          </div>
        ) : (
          filtered.map(tx => {
            const Icon = TYPE_ICONS[tx.type];
            const colorClass = TYPE_COLORS[tx.type];
            const explorerUrl = CHAIN_EXPLORERS[tx.chain] ? CHAIN_EXPLORERS[tx.chain] + tx.hash : null;
            return (
              <div key={tx.hash + tx.chain} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-card/50 border border-transparent hover:border-border transition-all">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm capitalize">{tx.type}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-card border border-border rounded font-bold uppercase tracking-wider text-muted-foreground">
                      {tx.chain.toUpperCase()}
                    </span>
                    {tx.status === "failed" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded font-bold text-red-500">Failed</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {tx.to && <span className="font-mono">{shortAddr(tx.to)}</span>}
                    {tx.timestamp > 0 && <span>· {timeAgo(tx.timestamp)}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-sm font-bold ${tx.type === "receive" ? "text-green-500" : tx.type === "send" ? "text-red-400" : "text-primary"}`}>
                    {tx.type === "receive" ? "+" : tx.type === "send" ? "-" : "~"}
                    {tx.amount} {tx.symbol}
                  </span>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
