import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, Copy, Share2, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useIsDesktop } from "@/hooks/use-mobile";

const NETWORKS = [
  { label: "Ethereum / EVM", key: "evm" as const, color: "#627EEA" },
  { label: "Solana", key: "sol" as const, color: "#14F195" },
];

export default function Receive() {
  const { activeWallet } = useWallet();
  const { toast } = useToast();
  const [network, setNetwork] = useState<"evm" | "sol">("evm");
  const [showPicker, setShowPicker] = useState(false);
  const isDesktop = useIsDesktop();

  const address = network === "evm"
    ? (activeWallet?.evmAddress ?? "")
    : (activeWallet?.solAddress ?? "");

  const short = address.length > 20
    ? `${address.slice(0, 10)}...${address.slice(-10)}`
    : address;

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({ title: "Address Copied", description: `${network === "evm" ? "EVM" : "Solana"} address copied to clipboard` });
    }
  };

  const handleShare = async () => {
    if (!address) return;
    if (navigator.share) {
      await navigator.share({ title: "My HOSHI Wallet Address", text: address });
    } else {
      handleCopy();
    }
  };

  const qrUrl = address
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(address)}&bgcolor=ffffff&color=000000&margin=16`
    : "";

  const selectedNet = NETWORKS.find(n => n.key === network)!;

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative bg-background`}>
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {isDesktop ? <h1 className="text-xl font-bold">Receive</h1> : (
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card"><ArrowLeft className="w-5 h-5" /></Link>
        )}
        {!isDesktop && <h1 className="text-lg font-bold">Receive</h1>}
        <div className="w-9" />
      </div>

      <div className={`flex-1 overflow-y-auto p-4 ${isDesktop ? "pb-8 max-w-lg mx-auto" : "pb-24"} flex flex-col items-center pt-6`}>

        {/* Network Selector */}
        <div className="w-full mb-6 relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNet.color }} />
              <span className="font-semibold text-sm">{selectedNet.label}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          {showPicker && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl overflow-hidden shadow-xl z-20">
              {NETWORKS.map(net => (
                <button
                  key={net.key}
                  onClick={() => { setNetwork(net.key); setShowPicker(false); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-black/20 transition-colors border-b border-border/50 last:border-0"
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: net.color }} />
                  <span className="font-medium text-sm">{net.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-1">Scan to Receive</h2>
          <p className="text-muted-foreground text-sm">Send only {selectedNet.label} tokens to this address.</p>
        </div>

        {address ? (
          <div className="bg-white p-3 rounded-3xl mb-6 relative group cursor-pointer shadow-lg" onClick={handleCopy}>
            <div className="w-56 h-56 flex items-center justify-center overflow-hidden">
              <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
            </div>
            <div className="absolute inset-3 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <Copy className="w-8 h-8 text-white" />
            </div>
          </div>
        ) : (
          <div className="w-56 h-56 bg-card border border-border rounded-3xl flex items-center justify-center mb-6">
            <p className="text-muted-foreground text-sm text-center px-4">No wallet connected</p>
          </div>
        )}

        {/* Address */}
        <div className="w-full bg-card rounded-2xl p-4 border border-border flex items-center justify-between gap-4 mb-4">
          <div className="overflow-hidden flex-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              {selectedNet.label} Address
            </p>
            <p className="font-mono text-sm break-all leading-relaxed">{address || "—"}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0 text-primary hover:text-primary hover:bg-primary/10">
            <Copy className="w-5 h-5" />
          </Button>
        </div>

        <Button variant="outline" className="w-full h-12 rounded-2xl font-bold bg-card border-border hover:bg-card/80" onClick={handleShare}>
          <Share2 className="w-5 h-5 mr-2" />
          Share Address
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
