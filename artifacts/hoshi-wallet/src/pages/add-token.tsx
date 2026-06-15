import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, Search, Plus } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useDiscoverTokens, getDiscoverTokensQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

export default function AddToken() {
  const { data: tokens, isLoading } = useDiscoverTokens({ query: { queryKey: getDiscoverTokensQueryKey() } });

  return (
    <div className="flex-1 flex flex-col h-[100dvh] relative bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">Manage Assets</h1>
        <div className="w-9" />
      </div>

      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search tokens or contract address..." 
            className="pl-10 bg-card border-border h-12 rounded-xl"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))
        ) : (
          tokens?.map((token, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/40 border border-border flex items-center justify-center overflow-hidden">
                  {token.logoUrl ? <img src={token.logoUrl} alt={token.symbol} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{token.symbol[0]}</span>}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{token.symbol}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-card border border-border rounded font-bold uppercase tracking-wider text-muted-foreground">{token.chain}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{token.name}</span>
                </div>
              </div>
              <Switch checked={i < 3} className="data-[state=checked]:bg-primary" />
            </div>
          ))
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
