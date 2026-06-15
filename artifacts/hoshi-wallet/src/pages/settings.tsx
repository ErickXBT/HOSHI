import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, User, Shield, Bell, Globe, LogOut, ChevronRight, Fingerprint, Moon, Sun, Monitor, EyeOff, Key } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings, useGetActiveWallet, getGetActiveWalletQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const { data: activeWallet } = useGetActiveWallet({ query: { queryKey: getGetActiveWalletQueryKey() } });
  const updateSettings = useUpdateSettings();

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    if (!settings) return;
    updateSettings.mutate({
      data: { [key]: value }
    });
  };

  const handleSelect = (key: keyof typeof settings, value: string) => {
    if (!settings) return;
    updateSettings.mutate({
      data: { [key]: value }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-[100dvh] relative bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold tracking-wider">SETTINGS</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-card rounded-3xl p-5 border border-border flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-border">
            <AvatarImage src={activeWallet?.avatarUrl || ""} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">{activeWallet?.name?.charAt(0) || "W"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-bold text-lg">{activeWallet?.name || "Loading..."}</h2>
            <p className="text-xs text-muted-foreground font-mono">{activeWallet?.address ? `${activeWallet.address.slice(0, 6)}...${activeWallet.address.slice(-4)}` : "..."}</p>
          </div>
          <Link href="/affiliate" className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Security & Privacy */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Security & Privacy</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <EyeOff className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Hide Balances</p>
                  <p className="text-xs text-muted-foreground">Obscure amounts on dashboard</p>
                </div>
              </div>
              {isLoading ? <Skeleton className="w-10 h-6 rounded-full" /> : (
                <Switch 
                  checked={settings?.hideBalances} 
                  onCheckedChange={(c) => handleToggle('hideBalances', c)} 
                  className="data-[state=checked]:bg-primary"
                />
              )}
            </div>
            <div className="p-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Biometrics</p>
                  <p className="text-xs text-muted-foreground">Use Face ID / Touch ID</p>
                </div>
              </div>
              {isLoading ? <Skeleton className="w-10 h-6 rounded-full" /> : (
                <Switch 
                  checked={settings?.biometricsEnabled} 
                  onCheckedChange={(c) => handleToggle('biometricsEnabled', c)} 
                  className="data-[state=checked]:bg-primary"
                />
              )}
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-black/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Recovery Phrase</p>
                  <p className="text-xs text-muted-foreground">Backup your wallet</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Preferences</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Globe className="w-4 h-4" />
                </div>
                <p className="font-semibold text-sm">Currency</p>
              </div>
              {isLoading ? <Skeleton className="w-20 h-8" /> : (
                <Select value={settings?.currency} onValueChange={(v) => handleSelect('currency', v)}>
                  <SelectTrigger className="w-24 h-8 text-xs border-border bg-black/40">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Moon className="w-4 h-4" />
                </div>
                <p className="font-semibold text-sm">Theme</p>
              </div>
              {isLoading ? <Skeleton className="w-24 h-8" /> : (
                <Select value={settings?.theme || "dark"} onValueChange={(v: any) => handleSelect('theme', v)}>
                  <SelectTrigger className="w-28 h-8 text-xs border-border bg-black/40">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark"><div className="flex items-center gap-2"><Moon className="w-3 h-3" /> Dark</div></SelectItem>
                    <SelectItem value="light" disabled><div className="flex items-center gap-2 text-muted-foreground"><Sun className="w-3 h-3" /> Light</div></SelectItem>
                    <SelectItem value="system"><div className="flex items-center gap-2"><Monitor className="w-3 h-3" /> System</div></SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Notifications</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Bell className="w-4 h-4" />
                </div>
                <p className="font-semibold text-sm">Price Alerts</p>
              </div>
              {isLoading ? <Skeleton className="w-10 h-6 rounded-full" /> : (
                <Switch 
                  checked={settings?.notifyPriceAlerts} 
                  onCheckedChange={(c) => handleToggle('notifyPriceAlerts', c)} 
                  className="data-[state=checked]:bg-primary"
                />
              )}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Shield className="w-4 h-4" />
                </div>
                <p className="font-semibold text-sm">Security Alerts</p>
              </div>
              {isLoading ? <Skeleton className="w-10 h-6 rounded-full" /> : (
                <Switch 
                  checked={settings?.notifySecurity} 
                  onCheckedChange={(c) => handleToggle('notifySecurity', c)} 
                  className="data-[state=checked]:bg-primary"
                />
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-4">
          <Button variant="outline" className="w-full h-12 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 font-bold bg-transparent">
            <LogOut className="w-5 h-5 mr-2" />
            Lock Wallet
          </Button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
