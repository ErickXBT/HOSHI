import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, ArrowRight, ScanLine } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useGetActiveWallet, getGetActiveWalletQueryKey } from "@workspace/api-client-react";
import { SiEthereum } from "react-icons/si";

export default function Send() {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const { data: activeWallet } = useGetActiveWallet({ query: { queryKey: getGetActiveWalletQueryKey() } });

  return (
    <div className="flex-1 flex flex-col h-[100dvh] relative bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">Send</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipient Address</label>
          <div className="relative">
            <Input 
              placeholder="0x..." 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="pr-12 bg-card border-border h-14 rounded-2xl font-mono text-sm"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-black/40 text-primary">
              <ScanLine className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-5 border border-border relative">
          <div className="flex justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Amount</span>
            <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-border cursor-pointer">
              <SiEthereum className="w-4 h-4 text-[#627EEA]" />
              <span className="text-sm font-bold">ETH</span>
            </div>
          </div>
          
          <div className="flex items-end gap-2 mb-2">
            <Input 
              type="number" 
              placeholder="0.0" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="text-4xl font-bold border-none bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 w-full"
            />
          </div>
          <div className="text-sm text-muted-foreground mb-4">$ {(Number(amount || 0) * 3100).toFixed(2)}</div>

          <div className="flex justify-between items-center text-xs pt-4 border-t border-border/50">
            <span className="text-muted-foreground">Available Balance: 2.45 ETH</span>
            <Button variant="ghost" className="h-6 px-3 text-[10px] font-bold uppercase tracking-wider text-primary border-primary/20 hover:bg-primary/10">Max</Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network</span>
            <span className="font-medium flex items-center gap-1.5"><SiEthereum className="w-3.5 h-3.5 text-[#627EEA]" /> Ethereum Mainnet</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="font-medium text-primary">~$2.50</span>
          </div>
          <div className="flex justify-between text-sm pt-3 border-t border-border/50">
            <span className="font-medium text-muted-foreground">Total</span>
            <span className="font-bold">{(Number(amount || 0) + 0.0008).toFixed(4)} ETH</span>
          </div>
        </div>

        <Button className="w-full h-14 rounded-2xl text-lg font-bold group" disabled={!amount || !address}>
          Review Send
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
      
      <BottomNav />
    </div>
  );
}
