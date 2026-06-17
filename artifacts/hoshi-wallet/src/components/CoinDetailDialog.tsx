import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ArrowUpRight, ArrowDownLeft, ExternalLink, BarChart2 } from "lucide-react";
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
}

export function Sparkline({ prices }: { prices: number[] }) {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 280, H = 80;
  const pts = prices.map((p, i) => [
    (i / (prices.length - 1)) * W,
    H - ((p - min) / range) * (H - 10) - 5,
  ]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${path} L${W},${H} L0,${H} Z`;
  const last = prices[prices.length - 1];
  const first = prices[0];
  const isUp = last >= first;
  const color = isUp ? "#22c55e" : "#ef4444";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function fmt(n: number) {
  return n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${n.toFixed(2)}`;
}

export function CoinDetailDialog({
  coin,
  onClose,
}: {
  coin: CoinDialogData | null;
  onClose: () => void;
}) {
  const [sparkline, setSparkline] = useState<number[]>([]);
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const id = coin?.id ?? "";
  const name = coin?.name ?? "";
  const symbol = coin?.symbol ?? "";
  const image = coin?.image ?? "";
  const price = coin?.price ?? 0;
  const change24h = coin?.change24h ?? 0;

  useEffect(() => {
    if (!id || !coin) return;
    setLoading(true);
    setSparkline([]);
    setDetails(null);
    Promise.allSettled([
      fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`)
        .then(r => r.json())
        .then(d => {
          const pts: number[] = (d.prices ?? []).map((p: [number, number]) => p[1]);
          setSparkline(pts);
        }),
      fetch(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`)
        .then(r => r.json())
        .then(d => setDetails(d)),
    ]).finally(() => setLoading(false));
  }, [id]);

  const mktCap = coin?.marketCap ?? (details?.market_data as any)?.market_cap?.usd ?? 0;
  const vol24h = coin?.volume24h ?? (details?.market_data as any)?.total_volume?.usd ?? 0;
  const desc: string = ((details?.description as any)?.en ?? "").replace(/<[^>]+>/g, "").slice(0, 220);

  return (
    <Dialog open={!!coin} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-card border-border rounded-3xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {image
              ? <img src={image} alt={symbol} className="w-10 h-10 rounded-full border border-border object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{symbol[0]}</div>
            }
            <div>
              <p className="font-bold">{symbol.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">{name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/20 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-2">
          <div className="text-3xl font-bold">
            {price > 0
              ? `$${price < 0.01 ? price.toPrecision(4) : price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"}
          </div>
          <div className={`text-sm font-semibold flex items-center gap-1 mt-1 ${change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
            {change24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
            {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}% (24h)
          </div>
        </div>

        <div className="px-4">
          {loading ? <Skeleton className="h-20 w-full rounded-xl" /> : <Sparkline prices={sparkline} />}
          <p className="text-[10px] text-muted-foreground text-right">7-day price chart</p>
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
            View Full Chart
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
