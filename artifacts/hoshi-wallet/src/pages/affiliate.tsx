import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, Gift, Copy, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useIsDesktop } from "@/hooks/use-mobile";

export default function Affiliate() {
  const { activeWallet } = useWallet();
  const [copied, setCopied] = useState(false);
  const isDesktop = useIsDesktop();

  const refCode = activeWallet?.evmAddress
    ? `HOSHI-${activeWallet.evmAddress.slice(2, 8).toUpperCase()}`
    : "HOSHI-XXXX";

  const refLink = `https://hoshi.wallet/?ref=${refCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative bg-background`}>
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {isDesktop ? <h1 className="text-xl font-bold">Affiliate</h1> : (
          <Link href="/settings" className="p-2 -ml-2 rounded-full hover:bg-card"><ArrowLeft className="w-5 h-5" /></Link>
        )}
        {!isDesktop && <h1 className="text-lg font-bold">Rewards</h1>}
        <div className="w-9" />
      </div>

      <div className={`flex-1 overflow-y-auto p-4 ${isDesktop ? "pb-8 max-w-lg" : "pb-24"}`}>
        <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 rounded-3xl p-6 mb-6 relative overflow-hidden">
          <Gift className="absolute -right-6 -top-6 w-32 h-32 text-primary/10 rotate-12" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Invite & Earn</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-[80%]">
              Share HOSHI with friends and earn 20% of their swap fees forever.
            </p>
            <div className="bg-black/40 border border-border rounded-xl p-3 flex items-center justify-between mb-2">
              <span className="font-mono text-sm tracking-widest text-primary">{refCode}</span>
              <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/20" onClick={handleCopy}>
                {copied ? <CheckCircle2 className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">{refLink}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card p-4 rounded-2xl border border-border">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Referrals</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Commission</p>
            <p className="text-2xl font-bold text-green-500">$0.00</p>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-5 border border-border flex flex-col items-center text-center">
          <p className="text-sm text-muted-foreground font-medium mb-2">Unclaimed Rewards</p>
          <div className="text-4xl font-bold tracking-tight mb-6">
            0 <span className="text-lg text-primary">HSH</span>
          </div>
          <Button className="w-full h-14 rounded-2xl text-lg font-bold" disabled>
            Claim Rewards
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
