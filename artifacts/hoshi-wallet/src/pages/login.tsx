import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateWallet } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import mascotLogo from "@assets/LOGO_HOSHI_SWAP_1781528480848.png";
import { ArrowRight, Wallet, KeyRound, Download } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createWallet = useCreateWallet();

  const [walletId, setWalletId] = useState("");
  const [password, setPassword] = useState("");
  const [newWalletId, setNewWalletId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [seedPhrase, setSeedPhrase] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId || !password) return;
    
    // Mock login, navigate to dashboard
    setLocation("/dashboard");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletId || !newPassword || newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Please check your inputs.",
        variant: "destructive"
      });
      return;
    }
    
    createWallet.mutate({
      data: {
        name: newWalletId,
        address: "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        chain: "ethereum"
      }
    }, {
      onSuccess: () => {
        setLocation("/dashboard");
      }
    });
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedPhrase) return;
    setLocation("/dashboard");
  };

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh] bg-background relative px-6 overflow-y-auto">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="flex flex-col items-center pt-16 pb-8 z-10">
        <div className="w-24 h-24 rounded-2xl border-2 border-primary bg-card/50 flex items-center justify-center p-4 mb-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/20 blur-xl" />
          <img src={mascotLogo} alt="HOSHI Mascot" className="w-full h-full object-contain relative z-10 drop-shadow-md" />
        </div>
        <h1 className="text-3xl font-bold tracking-widest text-foreground">HOSHI</h1>
        <p className="text-xs text-muted-foreground mt-2 tracking-widest uppercase">Next-Gen Crypto Super Wallet</p>
      </div>

      <div className="flex-1 w-full z-10 pb-10">
        <Tabs defaultValue="connect" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-transparent border-b border-border/50 rounded-none h-auto p-0 mb-6">
            <TabsTrigger 
              value="connect" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 font-semibold text-xs tracking-wider uppercase"
            >
              Connect
            </TabsTrigger>
            <TabsTrigger 
              value="create" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 font-semibold text-xs tracking-wider uppercase"
            >
              Create
            </TabsTrigger>
            <TabsTrigger 
              value="import" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 font-semibold text-xs tracking-wider uppercase"
            >
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connect">
            <form onSubmit={handleLogin} className="space-y-4 p-5 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Wallet ID</Label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={walletId} 
                    onChange={e => setWalletId(e.target.value)} 
                    placeholder="Enter your Wallet ID" 
                    className="pl-9 bg-black/40 border-border/50"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Enter password" 
                    className="pl-9 bg-black/40 border-border/50"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-2 font-bold tracking-wider group">
                ACCESS WALLET
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="create">
            <form onSubmit={handleCreate} className="space-y-4 p-5 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Choose Wallet ID</Label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={newWalletId} 
                    onChange={e => setNewWalletId(e.target.value)} 
                    placeholder="e.g. Satoshi" 
                    className="pl-9 bg-black/40 border-border/50"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="Create strong password" 
                    className="pl-9 bg-black/40 border-border/50"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Confirm Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Repeat password" 
                    className="pl-9 bg-black/40 border-border/50"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-2 font-bold tracking-wider group" disabled={createWallet.isPending}>
                {createWallet.isPending ? "GENERATING..." : "GENERATE WALLET"}
                {!createWallet.isPending && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="import">
            <form onSubmit={handleImport} className="space-y-4 p-5 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Seed Phrase / Private Key</Label>
                <Textarea 
                  value={seedPhrase} 
                  onChange={e => setSeedPhrase(e.target.value)} 
                  placeholder="Paste your 12 or 24-word seed phrase or private key here..." 
                  className="min-h-[120px] bg-black/40 border-border/50 resize-none font-mono text-sm"
                />
              </div>
              <Button type="submit" className="w-full mt-2 font-bold tracking-wider group">
                <Download className="w-4 h-4 mr-2" />
                CONNECT WALLET
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
