import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, Copy, Share2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetActiveWallet, getGetActiveWalletQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Receive() {
  const { data: activeWallet } = useGetActiveWallet({ query: { queryKey: getGetActiveWalletQueryKey() } });
  const { toast } = useToast();
  
  const address = activeWallet?.address || "0x71C...976F";

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard"
    });
  };

  return (
    <div className="flex-1 flex flex-col h-[100dvh] relative bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">Receive</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col items-center pt-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Scan QR Code</h2>
          <p className="text-muted-foreground text-sm">Send only supported tokens on appropriate networks to this address.</p>
        </div>

        <div className="bg-white p-4 rounded-3xl mb-8 relative group cursor-pointer" onClick={handleCopy}>
          <div className="w-64 h-64 border-4 border-white flex items-center justify-center bg-gray-100 overflow-hidden relative">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${address}&bgcolor=ffffff&color=000000`} 
              alt="Wallet Address QR" 
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <Copy className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="w-full bg-card rounded-2xl p-4 border border-border flex items-center justify-between gap-4 mb-6">
          <div className="overflow-hidden flex-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Your Address</p>
            <p className="font-mono text-sm truncate">{address}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0 text-primary hover:text-primary hover:bg-primary/10">
            <Copy className="w-5 h-5" />
          </Button>
        </div>

        <Button variant="outline" className="w-full h-14 rounded-2xl font-bold bg-card border-border hover:bg-card/80">
          <Share2 className="w-5 h-5 mr-2" />
          Share Address
        </Button>
      </div>
      
      <BottomNav />
    </div>
  );
}
