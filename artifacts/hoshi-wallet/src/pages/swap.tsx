import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, ArrowDown, Settings } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { SiEthereum, SiTether } from "react-icons/si";

export default function Swap() {
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");

  return (
    <div className="flex-1 flex flex-col h-[100dvh] relative bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">Swap</h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-card">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-card rounded-3xl p-4 border border-border relative mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">From</span>
            <span className="text-sm font-medium text-muted-foreground">Balance: 2.45 ETH</span>
          </div>
          <div className="flex items-center gap-3">
            <Input 
              type="number" 
              placeholder="0.0" 
              value={fromAmount}
              onChange={e => setFromAmount(e.target.value)}
              className="text-3xl font-bold border-none bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 w-1/2"
            />
            <div className="flex items-center gap-2 bg-black/40 border border-border rounded-full py-1.5 px-3 ml-auto cursor-pointer hover:bg-black/60">
              <SiEthereum className="w-4 h-4 text-[#627EEA]" />
              <span className="font-bold text-sm">ETH</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">$ {(Number(fromAmount || 0) * 3100).toFixed(2)}</div>
        </div>

        <div className="flex justify-center -my-6 relative z-10">
          <div className="w-10 h-10 bg-background border-4 border-background rounded-full flex items-center justify-center cursor-pointer hover:rotate-180 transition-transform duration-300">
            <div className="w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center text-primary">
              <ArrowDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">To</span>
            <span className="text-sm font-medium text-muted-foreground">Balance: 0 USDT</span>
          </div>
          <div className="flex items-center gap-3">
            <Input 
              type="number" 
              placeholder="0.0" 
              value={toAmount}
              onChange={e => setToAmount(e.target.value)}
              className="text-3xl font-bold border-none bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 w-1/2"
            />
            <div className="flex items-center gap-2 bg-black/40 border border-border rounded-full py-1.5 px-3 ml-auto cursor-pointer hover:bg-black/60">
              <SiTether className="w-4 h-4 text-[#26A17B]" />
              <span className="font-bold text-sm">USDT</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">$ {(Number(toAmount || 0) * 1).toFixed(2)}</div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant="outline" className="flex-1 rounded-xl bg-card border-border text-xs h-8">25%</Button>
          <Button variant="outline" className="flex-1 rounded-xl bg-card border-border text-xs h-8">50%</Button>
          <Button variant="outline" className="flex-1 rounded-xl bg-card border-border text-xs h-8">75%</Button>
          <Button variant="outline" className="flex-1 rounded-xl bg-card border-border text-xs h-8 text-primary">Max</Button>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Exchange Rate</span>
            <span className="font-medium">1 ETH = 3,100 USDT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="font-medium text-primary">~$4.50</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Slippage Tolerance</span>
            <span className="font-medium">0.5%</span>
          </div>
        </div>

        <Button className="w-full h-14 rounded-2xl text-lg font-bold">Review Swap</Button>
      </div>
      
      <BottomNav />
    </div>
  );
}
