import { Link, useLocation } from "wouter";
import { ChevronDown, Star, Bell, Settings as SettingsIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useWallet } from "@/contexts/WalletContext";
import { useIsDesktop } from "@/hooks/use-mobile";

export function TopNav() {
  const [location] = useLocation();
  const { activeWallet } = useWallet();
  const isDesktop = useIsDesktop();

  if (isDesktop) return null;

  return (
    <div className="flex flex-col px-4 pt-6 pb-2 z-40 bg-background/80 backdrop-blur-md sticky top-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {activeWallet?.name?.charAt(0)?.toUpperCase() ?? "W"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col cursor-pointer">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Wallet</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">{activeWallet?.name ?? "HOSHI Wallet"}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-muted-foreground">
          <Link href="/add-token">
            <div className="p-2 bg-card rounded-full cursor-pointer hover:text-primary transition-colors">
              <Star className="w-4 h-4" />
            </div>
          </Link>
          <div className="p-2 bg-card rounded-full cursor-pointer hover:text-primary transition-colors relative">
            <Bell className="w-4 h-4" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-card" />
          </div>
          <Link href="/settings">
            <div className="p-2 bg-card rounded-full cursor-pointer hover:text-primary transition-colors">
              <SettingsIcon className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-6 border-b border-border">
        <Link href="/dashboard">
          <div className={`pb-3 border-b-2 font-medium text-sm transition-colors ${location === "/dashboard" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            Coins
          </div>
        </Link>
        <Link href="/market">
          <div className={`pb-3 border-b-2 font-medium text-sm transition-colors ${location === "/market" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            Market
          </div>
        </Link>
        <Link href="/nfts">
          <div className={`pb-3 border-b-2 font-medium text-sm transition-colors ${location === "/nfts" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            NFTs
          </div>
        </Link>
      </div>
    </div>
  );
}
