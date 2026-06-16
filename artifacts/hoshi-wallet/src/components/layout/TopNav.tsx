import { Link, useLocation } from "wouter";
import { ChevronDown, Star, Bell, Settings as SettingsIcon, Sun, Moon, X, Check, Copy, Trash2, Plus, CheckCheck, Trash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWallet } from "@/hooks/useWallet";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications, type AppNotification } from "@/contexts/NotificationContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const PROFILE_PHOTO_KEY = "hoshi_profile_photo";

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

const notifIcon: Record<AppNotification["type"], string> = {
  price_alert: "📈",
  transaction: "✅",
  news: "📰",
  info: "ℹ️",
};

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead, markRead, clearAll } = useNotifications();
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" onClick={onClose}>
      <div className="flex-1" />
      <div
        className="bg-card border-t border-border rounded-t-3xl shadow-2xl max-h-[70dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.read) && (
              <button onClick={markAllRead} className="text-[10px] text-primary font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary/10">
                <CheckCheck className="w-3 h-3" />Mark read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-[10px] text-destructive font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-destructive/10">
                <Trash className="w-3 h-3" />Clear
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-full hover:bg-card text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-0 text-left transition-colors hover:bg-black/10",
                  !n.read && "bg-primary/5"
                )}
              >
                <span className="text-lg shrink-0 mt-0.5">{notifIcon[n.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold truncate", !n.read && "text-foreground")}>{n.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.time)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function WalletSwitcherSheet({ onClose }: { onClose: () => void }) {
  const { wallets, activeWallet, setActiveWalletId, deleteWallet, lockWallet } = useWallet();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const profilePhoto = localStorage.getItem(PROFILE_PHOTO_KEY) ?? "";

  const handleSelect = (id: string) => { setActiveWalletId(id); onClose(); };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteWallet(id);
      if (wallets.length <= 1) { lockWallet(); setLocation("/"); }
      setConfirmDelete(null); onClose();
    } else {
      setConfirmDelete(id);
    }
  };

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({ title: "Copied", description: "Address copied" });
  };

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" onClick={onClose}>
      <div className="flex-1" />
      <div
        className="bg-card border-t border-border rounded-t-3xl shadow-2xl max-h-[70dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-bold text-sm">My Wallets</p>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-card text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {wallets.map(w => (
            <div
              key={w.id}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl transition-colors mb-1",
                w.id === activeWallet?.id ? "bg-primary/10 border border-primary/30" : "hover:bg-black/10"
              )}
            >
              <button className="flex-1 flex items-center gap-3 min-w-0" onClick={() => handleSelect(w.id)}>
                <Avatar className="w-10 h-10 border border-border">
                  {w.id === activeWallet?.id && profilePhoto
                    ? <AvatarImage src={profilePhoto} className="object-cover" />
                    : null}
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    {w.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-sm truncate">{w.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{shortAddr(w.evmAddress)}</p>
                </div>
                {w.id === activeWallet?.id && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
              <button onClick={() => handleCopy(w.evmAddress)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(w.id)}
                className={cn("p-1.5 rounded-lg transition-colors", confirmDelete === w.id ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-red-400")}
                title={confirmDelete === w.id ? "Tap again to confirm" : "Delete"}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border">
          <Link href="/">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 border border-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add / Import Wallet
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function TopNav() {
  const [location] = useLocation();
  const { activeWallet } = useWallet();
  const isDesktop = useIsDesktop();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [showWalletSheet, setShowWalletSheet] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profilePhoto = localStorage.getItem(PROFILE_PHOTO_KEY) ?? "";

  if (isDesktop) return null;

  return (
    <>
      <div className="flex flex-col px-4 pt-6 pb-2 z-40 bg-background/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center justify-between">
          {/* Wallet selector */}
          <button
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
            onClick={() => setShowWalletSheet(true)}
          >
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src={profilePhoto} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {activeWallet?.name?.charAt(0)?.toUpperCase() ?? "W"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Wallet</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold">{activeWallet?.name ?? "HOSHI Wallet"}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 text-muted-foreground">
            <button
              onClick={toggleTheme}
              className="p-2 bg-card rounded-full cursor-pointer hover:text-primary transition-colors"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/add-token">
              <div className="p-2 bg-card rounded-full cursor-pointer hover:text-primary transition-colors">
                <Star className="w-4 h-4" />
              </div>
            </Link>
            <button
              onClick={() => setShowNotifications(true)}
              className="p-2 bg-card rounded-full cursor-pointer hover:text-primary transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <div className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-primary rounded-full border border-card flex items-center justify-center">
                  <span className="text-[8px] font-black text-primary-foreground px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </div>
              )}
            </button>
            <Link href="/settings">
              <div className="p-2 bg-card rounded-full cursor-pointer hover:text-primary transition-colors">
                <SettingsIcon className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-5 mt-6 border-b border-border overflow-x-auto scrollbar-hide">
          {[
            { href: "/dashboard", label: "Coins" },
            { href: "/market",    label: "Market" },
            { href: "/nfts",      label: "NFTs" },
            { href: "/news",      label: "News" },
            { href: "/polymarket", label: "Polymarket" },
          ].map(({ href, label }) => (
            <Link key={href} href={href}>
              <div className={`pb-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${location === href ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showWalletSheet && <WalletSwitcherSheet onClose={() => setShowWalletSheet(false)} />}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </>
  );
}
