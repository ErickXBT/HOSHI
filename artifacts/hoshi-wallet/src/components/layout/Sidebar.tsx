import { Link, useLocation } from "wouter";
import { useWallet } from "@/hooks/useWallet";
import {
  LayoutDashboard, PieChart, RefreshCcw, BarChart3,
  ArrowUpRight, ArrowDownLeft, Image, Plus, Users,
  Star, Settings, Bell, LogOut, ChevronDown, Copy,
  Check, Trash2, Clock, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import newLogo from "@assets/LOGO_HOSHI_SWAP_1781600746164.png";

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
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
          isActive
            ? "bg-primary text-primary-foreground"
            : item.highlight
            ? "border border-primary/40 text-primary hover:bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-card"
        )}
      >
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

  const handleSelect = (id: string) => {
    setActiveWalletId(id);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteWallet(id);
      if (wallets.length <= 1) {
        lockWallet();
        setLocation("/");
      }
      setConfirmDelete(null);
      onClose();
    } else {
      setConfirmDelete(id);
    }
  };

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Copied", description: "Address copied" });
  };

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-2 border-b border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold px-2 py-1">
          My Wallets
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {wallets.map(w => (
          <div
            key={w.id}
            className={cn(
              "flex items-center gap-2 p-2 mx-1 my-0.5 rounded-xl transition-colors",
              w.id === activeWallet?.id ? "bg-primary/10 border border-primary/30" : "hover:bg-card"
            )}
          >
            <button className="flex-1 flex items-center gap-2 min-w-0" onClick={() => handleSelect(w.id)}>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {w.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="font-semibold text-xs truncate max-w-[90px]">{w.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{shortAddr(w.evmAddress)}</span>
              </div>
              {w.id === activeWallet?.id && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
            </button>
            <button
              onClick={() => handleCopy(w.evmAddress)}
              className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleDelete(w.id)}
              className={cn(
                "p-1 rounded-lg transition-colors",
                confirmDelete === w.id
                  ? "text-red-500 bg-red-500/20"
                  : "text-muted-foreground hover:text-red-400"
              )}
              title={confirmDelete === w.id ? "Click again to confirm delete" : "Delete wallet"}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-border">
        <Link href="/">
          <button
            onClick={onClose}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add / Import Wallet
          </button>
        </Link>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { activeWallet, wallets, lockWallet } = useWallet();
  const { toast } = useToast();
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);

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
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {activeWallet?.name?.charAt(0)?.toUpperCase() ?? "W"}
              </div>
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

        <div className="py-2">
          <div className="h-px bg-border" />
        </div>

        {swapNav.map(item => <NavLink key={item.href} item={item} />)}

        <div className="py-2">
          <div className="h-px bg-border" />
        </div>

        {actionNav.map(item => <NavLink key={item.href} item={item} />)}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-border pt-3">
        {bottomNav.map(item => <NavLink key={item.href} item={item} />)}
        <Link href="/settings">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-all cursor-pointer">
            <Bell className="w-4 h-4 shrink-0" />
            <span>Notifications</span>
            <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
          </div>
        </Link>
        <button
          onClick={lockWallet}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Lock Wallet</span>
        </button>
      </div>
    </aside>
  );
}
