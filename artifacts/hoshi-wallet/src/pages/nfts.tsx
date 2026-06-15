import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { useGetActiveWallet, getGetActiveWalletQueryKey, useListNfts, getListNftsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon } from "lucide-react";

export default function Nfts() {
  const { data: activeWallet } = useGetActiveWallet({ query: { queryKey: getGetActiveWalletQueryKey() } });
  const walletId = activeWallet?.id || 1;
  const { data: nfts, isLoading } = useListNfts(walletId, { query: { enabled: !!activeWallet, queryKey: getListNftsQueryKey(walletId) } });

  return (
    <div className="flex-1 flex flex-col h-[100dvh] relative">
      <TopNav />
      
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-4 pt-6">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Gallery</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-2 border border-border">
                <Skeleton className="w-full aspect-square rounded-xl mb-3" />
                <Skeleton className="h-4 w-3/4 mb-1 mx-2" />
                <Skeleton className="h-3 w-1/2 mx-2 mb-2" />
              </div>
            ))}
          </div>
        ) : nfts && nfts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {nfts.map((nft) => (
              <div key={nft.id} className="bg-card rounded-2xl p-2 border border-border hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-black/40 relative">
                  {nft.imageUrl ? (
                    <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {nft.chain && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-white/10">
                      {nft.chain}
                    </div>
                  )}
                </div>
                <div className="px-1 pb-1">
                  <h3 className="font-bold text-sm truncate">{nft.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground truncate max-w-[60%]">{nft.collection}</p>
                    {nft.floorPriceUsd && <span className="text-xs font-bold text-primary">${nft.floorPriceUsd}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">No NFTs found</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">Your digital collectibles will appear here.</p>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
