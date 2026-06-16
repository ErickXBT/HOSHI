import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, ArrowRight, ScanLine, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useCoinPrices } from "@/hooks/usePrices";
import { isValidEvmAddress, isValidSolAddress, estimateGasFee, getEvmBalance } from "@/lib/wallet-gen";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useIsDesktop } from "@/hooks/use-mobile";

const CHAINS = [
  { symbol: "ETH", name: "Ethereum", color: "#627EEA", rpc: "https://cloudflare-eth.com", type: "evm" },
  { symbol: "SOL", name: "Solana", color: "#14F195", rpc: "", type: "sol" },
  { symbol: "BNB", name: "BNB Chain", color: "#F3BA2F", rpc: "https://bsc-dataseed1.binance.org", type: "evm" },
  { symbol: "MATIC", name: "Polygon", color: "#8247E5", rpc: "https://polygon-rpc.com", type: "evm" },
];

export default function Send() {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedChain, setSelectedChain] = useState(CHAINS[0]);
  const [showChainPicker, setShowChainPicker] = useState(false);
  const [gasFee, setGasFee] = useState<{ feeEth: string; gasPriceGwei: string } | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { activeWallet, getEvmSigner } = useWallet();
  const { data: prices } = useCoinPrices();
  const isDesktop = useIsDesktop();

  const priceMap: Record<string, number> = {};
  if (prices) for (const p of prices) priceMap[p.symbol.toUpperCase()] = p.current_price;
  const coinPrice = priceMap[selectedChain.symbol] ?? 0;

  const isValidAddr = address
    ? (selectedChain.type === "evm" ? isValidEvmAddress(address) : isValidSolAddress(address))
    : false;

  useEffect(() => {
    if (selectedChain.type !== "evm" || !activeWallet?.evmAddress) return;
    getEvmBalance(activeWallet.evmAddress, selectedChain.rpc).then(b => setBalance(b));
  }, [selectedChain, activeWallet?.evmAddress]);

  useEffect(() => {
    if (!isValidAddr || !amount || parseFloat(amount) <= 0 || selectedChain.type !== "evm" || !activeWallet?.evmAddress) {
      setGasFee(null);
      return;
    }
    const timer = setTimeout(async () => {
      const fee = await estimateGasFee(activeWallet.evmAddress, address, amount, selectedChain.rpc);
      setGasFee(fee);
    }, 600);
    return () => clearTimeout(timer);
  }, [address, amount, isValidAddr, selectedChain, activeWallet?.evmAddress]);

  const handleSend = async () => {
    if (!isValidAddr || !amount || !activeWallet) return;

    if (selectedChain.type === "sol") {
      toast({ title: "Solana Send", description: "Solana transaction signing is coming soon. Use a hardware wallet or Phantom in the meantime.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const signer = getEvmSigner(selectedChain.rpc);
      if (!signer) throw new Error("Wallet locked — please reconnect");

      const tx = await signer.sendTransaction({
        to: address,
        value: ethers.parseEther(amount),
      });

      toast({
        title: "Transaction Sent ✅",
        description: `TX Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}`,
      });
    } catch (err: any) {
      toast({ title: "Send Failed", description: err.message ?? "Transaction failed.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const maxAmount = parseFloat(balance) - (gasFee ? parseFloat(gasFee.feeEth) : 0.001);

  return (
    <div className={`flex-1 flex flex-col ${isDesktop ? "min-h-screen" : "h-[100dvh]"} relative bg-background`}>
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        {isDesktop ? <h1 className="text-xl font-bold">Send</h1> : (
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-card"><ArrowLeft className="w-5 h-5" /></Link>
        )}
        {!isDesktop && <h1 className="text-lg font-bold">Send</h1>}
        <div className="w-9" />
      </div>

      <div className={`flex-1 overflow-y-auto p-4 ${isDesktop ? "pb-8 max-w-lg" : "pb-24"} space-y-4`}>
        {/* Chain Selector */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Network</label>
          <button
            onClick={() => setShowChainPicker(!showChainPicker)}
            className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: selectedChain.color + "40" }} />
              <span className="font-semibold text-sm">{selectedChain.name}</span>
              <span className="text-xs text-muted-foreground">{selectedChain.symbol}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          {showChainPicker && (
            <div className="mt-1 bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
              {CHAINS.map(chain => (
                <button
                  key={chain.symbol}
                  onClick={() => { setSelectedChain(chain); setShowChainPicker(false); setGasFee(null); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-black/20 transition-colors border-b border-border/50 last:border-0"
                >
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: chain.color + "40" }} />
                  <span className="font-medium text-sm">{chain.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{chain.symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Recipient Address</label>
          <div className="relative">
            <Input
              placeholder={selectedChain.type === "evm" ? "0x..." : "Solana address..."}
              value={address}
              onChange={e => setAddress(e.target.value)}
              className={`pr-12 bg-card border-border h-14 rounded-2xl font-mono text-sm ${address && !isValidAddr ? "border-red-500/50" : address && isValidAddr ? "border-green-500/50" : ""}`}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-black/40 text-primary">
              <ScanLine className="w-5 h-5" />
            </button>
          </div>
          {address && !isValidAddr && <p className="text-xs text-red-500 mt-1">Invalid {selectedChain.name} address</p>}
        </div>

        {/* Amount */}
        <div className="bg-card rounded-3xl p-5 border border-border relative">
          <div className="flex justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Amount</span>
            <span className="text-xs text-muted-foreground">Balance: {parseFloat(balance).toFixed(6)} {selectedChain.symbol}</span>
          </div>
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="text-4xl font-bold border-none bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 w-full mb-2"
          />
          <div className="text-sm text-muted-foreground mb-4">≈ ${(parseFloat(amount || "0") * coinPrice).toFixed(2)} USD</div>
          <div className="flex justify-between items-center text-xs pt-3 border-t border-border/50">
            <span className="text-muted-foreground">Available: {parseFloat(balance).toFixed(6)} {selectedChain.symbol}</span>
            <Button variant="ghost" className="h-6 px-3 text-[10px] font-bold text-primary border-primary/20 hover:bg-primary/10"
              onClick={() => setAmount(Math.max(0, maxAmount).toFixed(6))}>
              Max
            </Button>
          </div>
        </div>

        {/* Gas Estimate */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network</span>
            <span className="font-medium">{selectedChain.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gas Price</span>
            <span className="font-medium text-primary">{gasFee ? `${parseFloat(gasFee.gasPriceGwei).toFixed(2)} Gwei` : "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="font-medium text-primary">{gasFee ? `~${parseFloat(gasFee.feeEth).toFixed(6)} ${selectedChain.symbol}` : "—"}</span>
          </div>
          {amount && gasFee && (
            <div className="flex justify-between text-sm pt-2 border-t border-border/50">
              <span className="font-medium text-muted-foreground">Total</span>
              <span className="font-bold">{(parseFloat(amount || "0") + parseFloat(gasFee.feeEth)).toFixed(6)} {selectedChain.symbol}</span>
            </div>
          )}
        </div>

        <Button
          className="w-full h-14 rounded-2xl text-lg font-bold group"
          disabled={!amount || !isValidAddr || sending}
          onClick={handleSend}
        >
          {sending ? "Sending..." : "Confirm & Send"}
          {!sending && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
