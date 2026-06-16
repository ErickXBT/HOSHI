import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, Shield, Bell, Globe, LogOut, ChevronRight, Fingerprint, EyeOff, Key, Copy, CheckCircle2, Sun, Moon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { decryptData } from "@/lib/wallet-crypto";
import { Input } from "@/components/ui/input";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { activeWallet, lockWallet, deleteWallet } = useWallet();
  const { toast } = useToast();
  const isDesktop = useIsDesktop();
  const { theme, toggleTheme } = useTheme();

  const [hideBalances, setHideBalances] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [seedPassword, setSeedPassword] = useState("");
  const [revealedSeed, setRevealedSeed] = useState("");
  const [seedError, setSeedError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("hoshi_settings");
    if (saved) {
      const s = JSON.parse(saved);
      setHideBalances(s.hideBalances ?? false);
      setPriceAlerts(s.priceAlerts ?? true);
      setCurrency(s.currency ?? "USD");
    }
  }, []);

  const saveSettings = (patch: object) => {
    const current = JSON.parse(localStorage.getItem("hoshi_settings") || "{}");
    localStorage.setItem("hoshi_settings", JSON.stringify({ ...current, ...patch }));
  };

  const handleRevealSeed = async () => {
    if (!activeWallet) return;
    try {
      const phrase = await decryptData(activeWallet.encrypted, seedPassword);
      setRevealedSeed(phrase);
      setSeedError("");
    } catch {
      setSeedError("Wrong password");
    }
  };

  const handleCopySeed = () => {
    navigator.clipboard.writeText(revealedSeed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLock = () => {
    lockWallet();
    setLocation("/");
  };

  const shortAddr = activeWallet?.evmAddress
    ? `${activeWallet.evmAddress.slice(0, 8)}...${activeWallet.evmAddress.slice(-6)}`
    : "—";

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative bg-background`}>
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {isDesktop ? <h1 className="text-xl font-bold tracking-wider">Settings</h1> : (
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card"><ArrowLeft className="w-5 h-5" /></Link>
        )}
        {!isDesktop && <h1 className="text-lg font-bold tracking-wider">SETTINGS</h1>}
        <div className="w-9" />
      </div>

      <div className={`flex-1 overflow-y-auto p-4 ${isDesktop ? "pb-8 max-w-2xl" : "pb-24"} space-y-6`}>

        {/* Profile */}
        <div className="bg-card rounded-3xl p-5 border border-border flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-border">
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
              {activeWallet?.name?.charAt(0)?.toUpperCase() ?? "W"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <h2 className="font-bold text-lg">{activeWallet?.name ?? "Wallet"}</h2>
            <p className="text-xs text-muted-foreground font-mono truncate">{shortAddr}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded font-bold">EVM</span>
              <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-500 rounded font-bold">SOL</span>
            </div>
          </div>
          <Link href="/affiliate">
            <div className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors cursor-pointer">
              <ChevronRight className="w-5 h-5" />
            </div>
          </Link>
        </div>

        {/* Security */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Security & Privacy</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><EyeOff className="w-4 h-4" /></div>
                <div>
                  <p className="font-semibold text-sm">Hide Balances</p>
                  <p className="text-xs text-muted-foreground">Obscure amounts on dashboard</p>
                </div>
              </div>
              <Switch checked={hideBalances} onCheckedChange={c => { setHideBalances(c); saveSettings({ hideBalances: c }); }} className="data-[state=checked]:bg-primary" />
            </div>
            <div className="p-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Fingerprint className="w-4 h-4" /></div>
                <div>
                  <p className="font-semibold text-sm">Biometrics</p>
                  <p className="text-xs text-muted-foreground">Face ID / Touch ID (if supported)</p>
                </div>
              </div>
              <Switch className="data-[state=checked]:bg-primary" />
            </div>
            <button onClick={() => { setShowSeedDialog(true); setRevealedSeed(""); setSeedPassword(""); setSeedError(""); }}
              className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-black/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Key className="w-4 h-4" /></div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Recovery Phrase</p>
                  <p className="text-xs text-muted-foreground">View & backup seed phrase</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Preferences</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">Theme</p>
                  <p className="text-xs text-muted-foreground">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm font-medium hover:border-primary/40 transition-colors"
              >
                {theme === "dark"
                  ? <><Sun className="w-3.5 h-3.5" /> Light</>
                  : <><Moon className="w-3.5 h-3.5" /> Dark</>
                }
              </button>
            </div>
            <div className="p-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Globe className="w-4 h-4" /></div>
                <p className="font-semibold text-sm">Currency</p>
              </div>
              <Select value={currency} onValueChange={v => { setCurrency(v); saveSettings({ currency: v }); }}>
                <SelectTrigger className="w-24 h-8 text-xs border-border bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "GBP", "JPY", "IDR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Notifications</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Bell className="w-4 h-4" /></div>
                <p className="font-semibold text-sm">Price Alerts</p>
              </div>
              <Switch checked={priceAlerts} onCheckedChange={c => { setPriceAlerts(c); saveSettings({ priceAlerts: c }); }} className="data-[state=checked]:bg-primary" />
            </div>
          </div>
        </div>

        {/* Danger */}
        <div className="space-y-2 pt-2">
          <Button variant="outline" onClick={handleLock} className="w-full h-12 rounded-xl text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/30 font-bold bg-transparent">
            <LogOut className="w-5 h-5 mr-2" />
            Lock Wallet
          </Button>
          <Button variant="outline" onClick={() => { if (activeWallet) { deleteWallet(activeWallet.id); setLocation("/"); } }}
            className="w-full h-12 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 font-bold bg-transparent">
            <Shield className="w-5 h-5 mr-2" />
            Remove This Wallet
          </Button>
        </div>
      </div>

      <BottomNav />

      {/* Seed Phrase Dialog */}
      <Dialog open={showSeedDialog} onOpenChange={open => { if (!open) { setShowSeedDialog(false); setRevealedSeed(""); } }}>
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle>🔑 Recovery Phrase</DialogTitle>
          </DialogHeader>
          {!revealedSeed ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter your wallet password to reveal the seed phrase.</p>
              <Input type="password" placeholder="Wallet password" value={seedPassword} onChange={e => setSeedPassword(e.target.value)}
                className="bg-black/40 border-border" onKeyDown={e => e.key === "Enter" && handleRevealSeed()} />
              {seedError && <p className="text-xs text-destructive">{seedError}</p>}
              <Button onClick={handleRevealSeed} className="w-full" disabled={!seedPassword}>Reveal Phrase</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-destructive font-semibold">⚠️ Never share this with anyone!</p>
              <div className="grid grid-cols-3 gap-2">
                {revealedSeed.split(" ").map((word, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
                    <span className="font-mono text-sm font-medium">{word}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={handleCopySeed} className="w-full border-border bg-card">
                {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy Phrase"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
