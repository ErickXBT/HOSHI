import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Portfolio from "@/pages/portfolio";
import Swap from "@/pages/swap";
import Send from "@/pages/send";
import Receive from "@/pages/receive";
import Market from "@/pages/market";
import Nfts from "@/pages/nfts";
import AddToken from "@/pages/add-token";
import Affiliate from "@/pages/affiliate";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/swap" component={Swap} />
      <Route path="/send" component={Send} />
      <Route path="/receive" component={Receive} />
      <Route path="/market" component={Market} />
      <Route path="/nfts" component={Nfts} />
      <Route path="/add-token" component={AddToken} />
      <Route path="/affiliate" component={Affiliate} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-[100dvh] w-full bg-black flex justify-center">
          <div className="w-full max-w-[390px] min-h-[100dvh] bg-background relative overflow-hidden shadow-2xl flex flex-col">
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
