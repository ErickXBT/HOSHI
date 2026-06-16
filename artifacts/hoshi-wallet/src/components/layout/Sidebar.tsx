import { Link, useLocation } from "wouter";
import { useWallet } from "@/hooks/useWallet";
import {
  LayoutDashboard, PieChart, RefreshCcw, BarChart3,
  ArrowUpRight, ArrowDownLeft, Image, Plus, Users,
  Star, Settings, Bell, LogOut, ChevronDown, Copy,
  Check, Trash2, Clock, Sun, Moon, Newspaper, Activity,
  X, CheckCheck, Trash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications, type AppNotification } from "@/contexts/NotificationContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import newLogo from "@assets/LOGO_HOSHI_SWAP_1781600746164.png";

const PROFILE_PHOTO_KEY = "hoshi_profile_photo";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  highlight?: boolean;
}

const mainNav: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/portfolio", icon: PieChart, label: "Portfolio" },
  { href: "/market", icon: BarChart3, label: "Market" },
];

const swapNav: NavItem[] = [
  { href: "/swap", icon: RefreshCcw, label: "Swap", highlight: true },
];

const actionNav: NavItem[] = [
  { href: "/send", icon: ArrowUpRight, label: "Send" },
  { href: "/receive", icon: ArrowDownLeft, label: "Receive" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/nfts", icon: Image, label: "NFTs" },
  { href: "/news", icon: Newspaper, label: "News" },
  { href: "/polymarket", icon: Activity, label: "Polymarket" },
  { href: "/add-token", icon: Plus, label: "Manage Tokens" },
  { href: "/affiliate", icon: Users, label: "Affiliate" },
];

const bottomNav: NavItem[] = [
  { href: "/add-token", icon: Star, label: "Watchlist" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function NavLink({ item }: { item: NavItem }) {
  const [location] = useLocation();
  const isActive = location === item.href;
  return (
    <Link href={item.href}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
        isActive
          ? "bg-primary text-primary-foreground"
          : item.highlight
          ? "border border-primary/40 text-primary hover:bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-card"
      )}>
        <item.icon className="w-4 h-4 shrink-0" />
        <span>{item.label}</span>
      </div>
    </Link>
  );
}

function WalletDropdown({ onClose }: { onClose: () => void }) {
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
    } else { setConfirmDelete(id); }
  };

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Copied", description: "Address copied" });
  };

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-2 border-b border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold px-2 py-1">My Wallets</p>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {wallets.map(w => (
          <div key={w.id} className={cn(
            "flex items-center gap-2 p-2 mx-1 my-0.5 rounded-xl transition-colors",
            w.id === activeWallet?.id ? "bg-primary/10 border border-primary/30" : "hover:bg-card"
          )}>
            <button className="flex-1 flex items-center gap-2 min-w-0" onClick={() => handleSelect(w.id)}>
              <Avatar className="w-8 h-8 border border-border">
                {w.id === activeWallet?.id && profilePhoto
                  ? <AvatarImage src={profilePhoto} className="object-cover" />
                  : null}
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                  {w.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start min-w-0">
                <span className="font-semibold text-xs truncate max-w-[90px]">{w.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{shortAddr(w.evmAddress)}</span>
              </div>
              {w.id === activeWallet?.id && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
            </button>
            <button onClick={() => handleCopy(w.evmAddress)} className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors">
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleDelete(w.id)}
              className={cn("p-1 rounded-lg transition-colors", confirmDelete === w.id ? "text-red-500 bg-red-500/20" : "text-muted-foreground hover:text-red-400")}
              title={confirmDelete === w.id ? "Click again to confirm delete" : "Delete wallet"}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-border">
        <Link href="/">
          <button onClick={onClose} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add / Import Wallet
          </button>
        </Link>
      </div>
    </div>
  );
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

const notifIcon: Record<AppNotification["type"], string> = {
  price_alert: "📈", transaction: "✅", news: "📰", info: "ℹ️",
};

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead, markRead, clearAll } = useNotifications();
  return (
    <div className="fixed inset-0 z-[60] flex" onClick={onClose}>
      <div className="flex-1" />
      <div
        className="w-80 h-full bg-card border-l border-border shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm">Notifications</h2>
          </div>
          <div className="flex items-center gap-1">
            {notifications.some(n => !n.read) && (
              <button onClick={markAllRead} title="Mark all read" className="p-1.5 rounded-lg hover:bg-primary/10 text-primary">
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll} title="Clear all" className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                <Trash className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-card text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <Bell className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs mt-1">Price alerts will appear here</p>
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-0 text-left hover:bg-black/10 transition-colors",
                  !n.read && "bg-primary/5"
                )}
              >
                <span className="text-base shrink-0 mt-0.5">{notifIcon[n.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-semibold", !n.read && "text-foreground")}>{n.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">{timeAgo(n.time)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { activeWallet, wallets, lockWallet } = useWallet();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profilePhoto = localStorage.getItem(PROFILE_PHOTO_KEY) ?? "";

  const handleCopyAddress = () => {
    if (activeWallet?.evmAddress) {
      navigator.clipboard.writeText(activeWallet.evmAddress);
      toast({ title: "Copied", description: "EVM address copied to clipboard" });
    }
  };

  const shortAddr = activeWallet?.evmAddress
    ? `${activeWallet.evmAddress.slice(0, 6)}...${activeWallet.evmAddress.slice(-4)}`
    : "—";

  return (
    <>
      <aside className="w-64 shrink-0 h-screen flex flex-col bg-background border-r border-border overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
            <img src={newLogo} alt="HOSHI Swap" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <p className="font-bold tracking-widest text-sm text-foreground">HOSHI</p>
            <p className="text-[9px] text-muted-foreground tracking-widest uppercase">Swap</p>
          </div>
        </div>

        {/* Wallet Selector */}
        <div className="px-4 py-4 border-b border-border relative">
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Active Wallet</p>
          <button
            className="w-full bg-card rounded-xl p-3 border border-border hover:border-primary/40 transition-colors text-left"
            onClick={() => setShowWalletDropdown(v => !v)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7 border border-border">
                  <AvatarImage src={profilePhoto} className="object-cover" />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                    {activeWallet?.name?.charAt(0)?.toUpperCase() ?? "W"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm truncate max-w-[100px]">
                  {activeWallet?.name ?? "No wallet"}
                </span>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showWalletDropdown && "rotate-180")} />
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-mono text-[11px]">{shortAddr}</span>
            </div>
            {wallets.length > 1 && (
              <div className="mt-1">
                <span className="text-[10px] text-muted-foreground">{wallets.length} wallets</span>
              </div>
            )}
          </button>

          {showWalletDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowWalletDropdown(false)} />
              <WalletDropdown onClose={() => setShowWalletDropdown(false)} />
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {mainNav.map(item => <NavLink key={item.href} item={item} />)}
          <div className="py-2"><div className="h-px bg-border" /></div>
          {swapNav.map(item => <NavLink key={item.href} item={item} />)}
          <div className="py-2"><div className="h-px bg-border" /></div>
          {actionNav.map(item => <NavLink key={item.href} item={item} />)}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-0.5 border-t border-border pt-3">
          {bottomNav.map(item => <NavLink key={item.href} item={item} />)}
          <button
            onClick={() => setShowNotifications(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Notifications</span>
            {unreadCount > 0 ? (
              <div className="ml-auto bg-primary text-primary-foreground text-[9px] font-black rounded-full min-w-[18px] h-4.5 px-1 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            ) : (
              <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button
            onClick={lockWallet}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Lock Wallet</span>
          </button>
        </div>
      </aside>

      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </>
  );
}
