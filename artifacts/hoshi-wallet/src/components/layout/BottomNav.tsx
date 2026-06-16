import { Link, useLocation } from "wouter";
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, BarChart3, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/use-mobile";

export function BottomNav() {
  const [location] = useLocation();
  const isDesktop = useIsDesktop();

  if (isDesktop) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 bg-card/90 backdrop-blur-xl border-t border-border flex items-center justify-around px-4 pb-4 pt-2 z-50">
      <Link href="/send" className="flex flex-col items-center gap-1 group">
        <div className={cn("p-2 rounded-xl transition-colors", location === "/send" ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
          <ArrowUpRight className="w-5 h-5" />
        </div>
        <span className={cn("text-[10px] font-medium", location === "/send" ? "text-primary" : "text-muted-foreground")}>Send</span>
      </Link>

      <Link href="/receive" className="flex flex-col items-center gap-1 group">
        <div className={cn("p-2 rounded-xl transition-colors", location === "/receive" ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
          <ArrowDownLeft className="w-5 h-5" />
        </div>
        <span className={cn("text-[10px] font-medium", location === "/receive" ? "text-primary" : "text-muted-foreground")}>Receive</span>
      </Link>

      <Link href="/swap" className="flex flex-col items-center gap-1 group -mt-6">
        <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20 border-4 border-background text-primary-foreground">
          <RefreshCcw className="w-6 h-6" />
        </div>
        <span className={cn("text-[10px] font-medium mt-1", location === "/swap" ? "text-primary" : "text-muted-foreground")}>Swap</span>
      </Link>

      <Link href="/market" className="flex flex-col items-center gap-1 group">
        <div className={cn("p-2 rounded-xl transition-colors", location === "/market" ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
          <BarChart3 className="w-5 h-5" />
        </div>
        <span className={cn("text-[10px] font-medium", location === "/market" ? "text-primary" : "text-muted-foreground")}>Market</span>
      </Link>

      <Link href="/portfolio" className="flex flex-col items-center gap-1 group">
        <div className={cn("p-2 rounded-xl transition-colors", location === "/portfolio" ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
          <PieChart className="w-5 h-5" />
        </div>
        <span className={cn("text-[10px] font-medium", location === "/portfolio" ? "text-primary" : "text-muted-foreground")}>Portfolio</span>
      </Link>
    </div>
  );
}
