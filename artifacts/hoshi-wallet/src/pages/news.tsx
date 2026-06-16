import { BottomNav } from "@/components/layout/BottomNav";
import { TopNav } from "@/components/layout/TopNav";
import { ArrowLeft, ExternalLink, RefreshCw, Newspaper, Clock } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsDesktop } from "@/hooks/use-mobile";

interface NewsItem {
  id: string;
  title: string;
  body: string;
  url: string;
  source: string;
  imageUrl: string;
  publishedAt: number;
  categories: string;
}

async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch(
    "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest&extraParams=HoshiWallet"
  );
  if (!res.ok) throw new Error("News fetch failed");
  const data = await res.json();
  return (data.Data ?? []).slice(0, 30).map((a: any) => ({
    id: String(a.id),
    title: a.title,
    body: a.body,
    url: a.url,
    source: a.source_info?.name ?? a.source,
    imageUrl: a.imageurl,
    publishedAt: a.published_on * 1000,
    categories: a.categories,
  }));
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function CategoryBadge({ cat }: { cat: string }) {
  const cats = cat.split("|").slice(0, 2);
  return (
    <div className="flex gap-1 flex-wrap">
      {cats.map(c => (
        <span key={c} className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold uppercase tracking-wide">
          {c.trim()}
        </span>
      ))}
    </div>
  );
}

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const isDesktop = useIsDesktop();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const data = await fetchNews();
      setNews(data);
    } catch {
      setError("Could not load news. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative bg-background`}>
      {!isDesktop && <TopNav />}

      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {isDesktop ? (
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Crypto News</h1>
          </div>
        ) : (
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        {!isDesktop && (
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-primary" />
            <h1 className="text-lg font-bold">News</h1>
          </div>
        )}
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="p-2 rounded-full hover:bg-card text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto ${isDesktop ? "pb-8 px-6 pt-6 max-w-3xl" : "pb-24 px-4 pt-4"}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground">Live crypto news via CryptoCompare</span>
        </div>

        {error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm mb-3">{error}</p>
            <button onClick={() => load()} className="text-primary text-sm font-bold">Try again</button>
          </div>
        )}

        {loading && !error && (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3 bg-card rounded-2xl p-4 border border-border">
                <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {news.map(item => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 bg-card rounded-2xl p-4 border border-border hover:border-primary/30 transition-colors group"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-black/30 border border-border">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  {item.categories && <CategoryBadge cat={item.categories} />}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-muted-foreground font-medium">{item.source}</span>
                    <span className="text-[10px] text-muted-foreground/50">•</span>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      {timeAgo(item.publishedAt)}
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground/40 ml-auto group-hover:text-primary/60 transition-colors" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
