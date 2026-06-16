import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { Image as ImageIcon, ExternalLink } from "lucide-react";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useWallet } from "@/contexts/WalletContext";

export default function Nfts() {
  const { activeWallet } = useWallet();
  const isDesktop = useIsDesktop();

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative`}>
      <TopNav />
      <div className={`flex-1 overflow-y-auto ${isDesktop ? "px-6 pt-6 pb-8" : "pb-24 px-4 pt-6"} scrollbar-hide`}>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Gallery</h2>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="font-bold text-xl mb-2">No NFTs Yet</h3>
          <p className="text-sm text-muted-foreground max-w-[250px] mb-6">
            Your digital collectibles will appear here once you acquire NFTs on Ethereum or Solana.
          </p>

          {activeWallet?.evmAddress && (
            <a
              href={`https://opensea.io/${activeWallet.evmAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-xl px-4 py-2 hover:bg-primary/10"
            >
              <ExternalLink className="w-4 h-4" />
              View on OpenSea
            </a>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
