import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, ArrowRight, ScanLine, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useCoinPrices } from "@/hooks/usePrices";
import { isValidEvmAddress, isValidSolAddress, estimateGasFee, getEvmBalance } from "@/lib/wallet-gen";
import { ethers } from "ethers";
import { sendSol, getSolLamports } from "@/lib/solana-tx";
import { useToast } from "@/hooks/use-toast";
import { useIsDesktop } from "@/hooks/use-mobile";

const CHAINS = [
  {
    symbol: "ETH", name: "Ethereum", rpc: "https://eth.llamarpc.com", type: "evm" as const,
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  {
    symbol: "SOL", name: "Solana", rpc: "", type: "sol" as const,
    logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  },
  {
    symbol: "BNB", name: "BNB Chain", rpc: "https://bsc-dataseed1.binance.org", type: "evm" as const,
    logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  },
  {
    symbol: "MATIC", name: "Polygon", rpc: "https://polygon-rpc.com", type: "evm" as const,
    logo: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  },
  {
    symbol: "ARB", name: "Arbitrum", rpc: "https://arb1.arbitrum.io/rpc", type: "evm" as const,
    logo: "https://assets.coingecko.com/coins/images/16547/small/arb.jpg",
  },
  {
    symbol: "BASE", name: "Base", rpc: "https://mainnet.base.org", type: "evm" as const,
    logo: "https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/Base_Symbol_Blue.png",
  },
];

function ChainLogo({ logo, symbol }: { logo: string; symbol: string }) {
  const [err, setErr] = useState(false);
  if (!logo || err) {
    return (
      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
        {symbol.slice(0, 2)}
      </div>
    );
  }
  return <img src={logo} alt={symbol} className="w-7 h-7 rounded-full object-contain shrink-0" onError={() => setErr(true)} />;
}

export default function Send() {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedChain, setSelectedChain] = useState(CHAINS[0]);
  const [showChainPicker, setShowChainPicker] = useState(false);
  const [gasFee, setGasFee] = useState<{ feeEth: string; gasPriceGwei: string } | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { activeWallet, getEvmSigner, getSolKeypair, isLocked } = useWallet();
  const { data: prices } = useCoinPrices();
  const isDesktop = useIsDesktop();

  const priceMap: Record<string, number> = {};
  if (prices) for (const p of prices) priceMap[p.symbol.toUpperCase()] = p.current_price ?? 0;
  const coinPrice = priceMap[selectedChain.symbol] ?? 0;

  const isValidAddr = address
    ? (selectedChain.type === "evm" ? isValidEvmAddress(address) : isValidSolAddress(address))
    : false;

  useEffect(() => {
    if (!activeWallet) return;
    setBalance("0");
    if (selectedChain.type === "evm") {
      getEvmBalance(activeWallet.evmAddress, selectedChain.rpc).then(b => setBalance(b));
    } else if (selectedChain.type === "sol" && activeWallet.solAddress) {
      getSolLamports(activeWallet.solAddress).then(lam => setBalance((Number(lam) / 1e9).toFixed(9)));
    }
  }, [selectedChain, activeWallet?.evmAddress, activeWallet?.solAddress]);

  useEffect(() => {
    if (!isValidAddr || !amount || parseFloat(amount) <= 0 || selectedChain.type !== "evm" || !activeWallet?.evmAddress) {
      setGasFee(null); return;
    }
    const timer = setTimeout(async () => {
      const fee = await estimateGasFee(activeWallet.evmAddress, address, amount, selectedChain.rpc);
      setGasFee(fee);
    }, 600);
    return () => clearTimeout(timer);
  }, [address, amount, isValidAddr, selectedChain, activeWallet?.evmAddress]);

  const handleSend = async () => {
    if (!isValidAddr || !amount || !activeWallet) return;
    if (isLocked) {
      toast({ title: "Wallet Locked", description: "Please unlock your wallet first.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      if (selectedChain.type === "sol") {
        const keypair = await getSolKeypair();
        if (!keypair) throw new Error("Could not derive Solana keypair");
        const lamports = BigInt(Math.round(parseFloat(amount) * 1e9));
        const sig = await sendSol(keypair.pubKey, address, lamports, keypair.privKey);
        toast({
          title: "SOL Sent ✅",
          description: `TX: ${sig.slice(0, 8)}...${sig.slice(-6)} — View on Solscan`,
        });
      } else {
        const signer = getEvmSigner(selectedChain.rpc);
        if (!signer) throw new Error("Wallet locked — please reconnect");
        const tx = await signer.sendTransaction({ to: address, value: ethers.parseEther(amount) });
        toast({
          title: `${selectedChain.symbol} Sent ✅`,
          description: `TX: ${tx.hash.slice(0, 8)}...${tx.hash.slice(-6)}`,
        });
      }
      setAddress("");
      setAmount("");
    } catch (err: unknown) {
      toast({ title: "Send Failed ❌", description: (err as Error).message ?? "Transaction failed.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const maxAmount = parseFloat(balance) - (gasFee ? parseFloat(gasFee.feeEth) : selectedChain.type === "sol" ? 0.000005 : 0.001);

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
            <div className="flex items-center gap-3">
              <ChainLogo logo={selectedChain.logo} symbol={selectedChain.symbol} />
              <div className="text-left">
                <p className="font-semibold text-sm">{selectedChain.name}</p>
                <p className="text-[10px] text-muted-foreground">{selectedChain.type === "evm" ? "EVM Compatible" : "Solana"}</p>
              </div>
              <span className="text-xs text-muted-foreground bg-black/30 px-2 py-0.5 rounded-full border border-border">{selectedChain.symbol}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          {showChainPicker && (
            <div className="mt-1 bg-card border border-border rounded-2xl overflow-hidden shadow-xl z-20 relative">
              {CHAINS.map(chain => (
                <button
                  key={chain.symbol}
                  onClick={() => { setSelectedChain(chain); setShowChainPicker(false); setGasFee(null); }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-black/20 transition-colors border-b border-border/50 last:border-0 ${chain.symbol === selectedChain.symbol ? "bg-primary/10" : ""}`}
                >
                  <ChainLogo logo={chain.logo} symbol={chain.symbol} />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{chain.name}</p>
                    <p className="text-[10px] text-muted-foreground">{chain.type === "evm" ? "EVM" : "Solana"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{chain.symbol}</span>
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
              placeholder={selectedChain.type === "evm" ? "0x..." : "Solana address (base58)..."}
              value={address}
              onChange={e => setAddress(e.target.value)}
              className={`pr-12 bg-card border-border h-14 rounded-2xl font-mono text-sm ${address && !isValidAddr ? "border-red-500/50" : address && isValidAddr ? "border-green-500/50" : ""}`}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-black/40 text-primary">
              <ScanLine className="w-5 h-5" />
            </button>
          </div>
          {address && !isValidAddr && <p className="text-xs text-red-500 mt-1">Invalid {selectedChain.name} address</p>}
          {address && isValidAddr && <p className="text-xs text-green-500 mt-1">✓ Valid address</p>}
        </div>

        {/* Amount */}
        <div className="bg-card rounded-3xl p-5 border border-border relative">
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChainLogo logo={selectedChain.logo} symbol={selectedChain.symbol} />
              <span className="text-sm font-medium">{selectedChain.symbol}</span>
            </div>
            <span className="text-xs text-muted-foreground">Balance: {parseFloat(balance).toFixed(6)} {selectedChain.symbol}</span>
          </div>
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="text-4xl font-bold border-none bg-transparent p-0 h-auto shadow-none focus-visible:ring-0 w-full mb-2"
          />
          <div className="text-sm text-muted-foreground mb-4">
            ≈ ${(parseFloat(amount || "0") * coinPrice).toFixed(2)} USD
          </div>
          <div className="flex justify-between items-center text-xs pt-3 border-t border-border/50">
            <span className="text-muted-foreground">Available: {parseFloat(balance).toFixed(6)} {selectedChain.symbol}</span>
            <Button variant="ghost" className="h-6 px-3 text-[10px] font-bold text-primary border-primary/20 hover:bg-primary/10"
              onClick={() => setAmount(Math.max(0, maxAmount).toFixed(6))}>
              Max
            </Button>
          </div>
        </div>

        {/* Fee Info */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Network</span>
            <div className="flex items-center gap-1.5">
              <ChainLogo logo={selectedChain.logo} symbol={selectedChain.symbol} />
              <span className="font-medium">{selectedChain.name}</span>
            </div>
          </div>
          {selectedChain.type === "evm" ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gas Price</span>
                <span className="font-medium text-primary">{gasFee ? `${parseFloat(gasFee.gasPriceGwei).toFixed(2)} Gwei` : "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium text-primary">{gasFee ? `~${parseFloat(gasFee.feeEth).toFixed(6)} ${selectedChain.symbol}` : "—"}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network Fee</span>
              <span className="font-medium text-primary">~0.000005 SOL</span>
            </div>
          )}
          {amount && gasFee && selectedChain.type === "evm" && (
            <div className="flex justify-between text-sm pt-2 border-t border-border/50">
              <span className="font-medium text-muted-foreground">Total</span>
              <span className="font-bold">{(parseFloat(amount || "0") + parseFloat(gasFee.feeEth)).toFixed(6)} {selectedChain.symbol}</span>
            </div>
          )}
        </div>

        <Button
          className="w-full h-14 rounded-2xl text-lg font-bold group"
          disabled={!amount || !isValidAddr || sending || parseFloat(amount) <= 0}
          onClick={handleSend}
        >
          {sending ? "Sending..." : `Send ${selectedChain.symbol}`}
          {!sending && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>

        {isLocked && <p className="text-center text-xs text-amber-500">⚠️ Wallet is locked — unlock it from the login screen to send</p>}
      </div>

      <BottomNav />
    </div>
  );
}
