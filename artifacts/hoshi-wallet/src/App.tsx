import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/contexts/WalletContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useWallet } from "@/hooks/useWallet";
import { useIsDesktop } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/layout/Sidebar";

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
import History from "@/pages/history";
import News from "@/pages/news";
import Polymarket from "@/pages/polymarket";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AppRoutes() {
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
      <Route path="/history" component={History} />
      <Route path="/news" component={News} />
      <Route path="/polymarket" component={Polymarket} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isLocked } = useWallet();
  const [location] = useLocation();
  const isDesktop = useIsDesktop();
  const isOnLoginPage = location === "/" || location === "";

  if (isDesktop) {
    if (!isLocked && !isOnLoginPage) {
      return (
        <div className="flex h-screen bg-background overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-y-auto bg-background">
            <AppRoutes />
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background">
        <AppRoutes />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col">
      <AppRoutes />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <AppContent />
                <Toaster />
              </WouterRouter>
            </TooltipProvider>
          </NotificationProvider>
        </QueryClientProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
