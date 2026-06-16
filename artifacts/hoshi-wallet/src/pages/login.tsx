import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { useIsDesktop } from "@/hooks/use-mobile";
import mascotLogo from "@assets/LOGO_HOSHI_SWAP_1781600746164.png";
import { ArrowRight, Wallet, KeyRound, Download, Shield, Zap, Globe, Copy, CheckCircle2, Eye, EyeOff } from "lucide-react";

function SeedPhraseBackupDialog({
  open, mnemonic, onConfirm
}: { open: boolean; mnemonic: string; onConfirm: () => void }) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const words = mnemonic.split(" ");

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md bg-background border-border" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">🔐 Backup Seed Phrase</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          These 12 words are your wallet. Write them down and store them safely. <strong className="text-destructive">Never share them.</strong>
        </p>
        <div className="grid grid-cols-3 gap-2 my-4">
          {words.map((word, i) => (
            <div key={i} className="bg-card border border-border rounded-lg px-2 py-1.5 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
              <span className="font-mono text-sm font-medium">{word}</span>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy} className="w-full mb-2 border-border bg-card">
          {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied!" : "Copy Seed Phrase"}
        </Button>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="rounded" />
          I have saved my seed phrase in a safe place
        </label>
        <Button onClick={onConfirm} disabled={!confirmed} className="w-full mt-2 font-bold">
          Continue to Wallet
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function LoginForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { createWallet, importWallet, connectWallet, wallets } = useWallet();

  const [walletName, setWalletName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [importName, setImportName] = useState("");
  const [importPw, setImportPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [backupMnemonic, setBackupMnemonic] = useState("");
  const [showBackup, setShowBackup] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName || !password) return;
    setLoading(true);
    try {
      await connectWallet(walletName, password);
      setLocation("/dashboard");
    } catch {
      toast({ title: "Access Denied", description: "Wallet not found or wrong password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPw || newPw !== confirmPw) {
      toast({ title: "Error", description: newPw !== confirmPw ? "Passwords do not match." : "Please fill all fields.", variant: "destructive" });
      return;
    }
    if (newPw.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await createWallet(newName, newPw);
      setBackupMnemonic(result.mnemonic);
      setShowBackup(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to create wallet.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedPhrase || !importPw) {
      toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await importWallet(importName || "Imported Wallet", seedPhrase, importPw);
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message ?? "Invalid seed phrase.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeedPhraseBackupDialog
        open={showBackup}
        mnemonic={backupMnemonic}
        onConfirm={() => { setShowBackup(false); setLocation("/dashboard"); }}
      />

      <Tabs defaultValue={wallets.length > 0 ? "connect" : "create"} className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-transparent border-b border-border/50 rounded-none h-auto p-0 mb-6">
          {["connect", "create", "import"].map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 font-semibold text-xs tracking-wider uppercase"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="connect">
          <form onSubmit={handleConnect} className="space-y-4 p-5 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Wallet Name</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={walletName} onChange={e => setWalletName(e.target.value)} placeholder="Enter your wallet name" className="pl-9 bg-black/40 border-border/50" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="pl-9 pr-9 bg-black/40 border-border/50" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full mt-2 font-bold tracking-wider group" disabled={loading}>
              {loading ? "UNLOCKING..." : "ACCESS WALLET"}
              {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="create">
          <form onSubmit={handleCreate} className="space-y-3 p-5 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Wallet Name</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Main Wallet" className="pl-9 bg-black/40 border-border/50" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Create strong password (min 6 chars)" className="pl-9 bg-black/40 border-border/50" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Confirm Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat password" className="pl-9 bg-black/40 border-border/50" />
              </div>
            </div>
            <Button type="submit" className="w-full mt-2 font-bold tracking-wider group" disabled={loading}>
              {loading ? "GENERATING..." : "GENERATE WALLET"}
              {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="import">
          <form onSubmit={handleImport} className="space-y-3 p-5 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Wallet Name</Label>
              <Input value={importName} onChange={e => setImportName(e.target.value)} placeholder="e.g. My MetaMask" className="bg-black/40 border-border/50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Seed Phrase / Private Key</Label>
              <Textarea value={seedPhrase} onChange={e => setSeedPhrase(e.target.value)} placeholder="Paste your 12 or 24-word seed phrase..." className="min-h-[100px] bg-black/40 border-border/50 resize-none font-mono text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Encryption Password</Label>
              <Input type="password" value={importPw} onChange={e => setImportPw(e.target.value)} placeholder="Password to protect this wallet" className="bg-black/40 border-border/50" />
            </div>
            <Button type="submit" className="w-full mt-2 font-bold tracking-wider group" disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              {loading ? "IMPORTING..." : "IMPORT WALLET"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function Login() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <div className="min-h-screen flex bg-background">
        {/* Left Panel */}
        <div className="w-1/2 relative overflow-hidden flex flex-col items-center justify-center p-12"
          style={{ background: "linear-gradient(135deg, #1a0a00 0%, #2d1200 30%, #F97316 100%)" }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="w-28 h-28 rounded-3xl border-2 border-primary/50 bg-black/30 flex items-center justify-center mb-6 relative overflow-hidden backdrop-blur-sm">
              <img src={mascotLogo} alt="HOSHI" className="w-20 h-20 object-contain drop-shadow-2xl" />
            </div>
            <h1 className="text-5xl font-bold tracking-widest text-white mb-2">HOSHI</h1>
            <p className="text-sm text-white/60 tracking-[0.3em] uppercase mb-12">Next-Gen Crypto Super Swap</p>

            <div className="space-y-4 w-full max-w-xs">
              {[
                { icon: Shield, title: "Non-Custodial", desc: "You own your keys, always" },
                { icon: Globe, title: "Multi-Chain", desc: "ETH, BTC, SOL & 100+ more" },
                { icon: Zap, title: "Built for Web3", desc: "DeFi, NFTs & beyond" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white text-sm">{title}</p>
                    <p className="text-white/60 text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-1/2 flex flex-col items-center justify-center p-12 bg-background">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold mb-1">Welcome Back</h2>
              <p className="text-muted-foreground text-sm">Access your crypto portfolio</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh] bg-background relative px-6 overflow-y-auto">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="flex flex-col items-center pt-16 pb-8 z-10">
        <div className="w-24 h-24 rounded-2xl border-2 border-primary bg-card/50 flex items-center justify-center p-4 mb-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/20 blur-xl" />
          <img src={mascotLogo} alt="HOSHI" className="w-full h-full object-contain relative z-10 drop-shadow-md" />
        </div>
        <h1 className="text-3xl font-bold tracking-widest text-foreground">HOSHI</h1>
        <p className="text-xs text-muted-foreground mt-2 tracking-widest uppercase">Next-Gen Crypto Super Swap</p>
      </div>
      <div className="flex-1 w-full z-10 pb-10">
        <LoginForm />
      </div>
    </div>
  );
}
