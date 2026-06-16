import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useCoinPrices } from "@/hooks/usePrices";

export interface AppNotification {
  id: string;
  type: "price_alert" | "transaction" | "news" | "info";
  title: string;
  message: string;
  time: number;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "time" | "read">) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);
const STORAGE_KEY = "hoshi_notifications_v2";

function load(): AppNotification[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function save(items: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 60)));
}

function PriceAlertWatcher({ addNotification }: { addNotification: NotificationContextType["addNotification"] }) {
  const { data: prices } = useCoinPrices();
  const alertedRef = { current: new Set<string>(JSON.parse(sessionStorage.getItem("hoshi_alerted") || "[]")) };

  useEffect(() => {
    if (!prices) return;
    const settings = JSON.parse(localStorage.getItem("hoshi_settings") || "{}");
    if (!settings.priceAlerts) return;

    for (const coin of prices) {
      const pct = coin.price_change_percentage_24h ?? 0;
      const key = `${coin.id}_${Math.floor(Date.now() / 3600000)}`;
      if (!alertedRef.current.has(key) && Math.abs(pct) >= 5) {
        const dir = pct > 0 ? "📈 up" : "📉 down";
        addNotification({
          type: "price_alert",
          title: `${coin.symbol.toUpperCase()} Price Alert`,
          message: `${coin.symbol.toUpperCase()} is ${dir} ${Math.abs(pct).toFixed(1)}% in the last 24h — now $${coin.current_price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
          link: `https://www.coingecko.com/en/coins/${coin.id}`,
        });
        alertedRef.current.add(key);
        sessionStorage.setItem("hoshi_alerted", JSON.stringify([...alertedRef.current]));
      }
    }
  }, [prices]);

  return null;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(load);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "time" | "read">) => {
    setNotifications(prev => {
      const item: AppNotification = { ...n, id: crypto.randomUUID(), time: Date.now(), read: false };
      const updated = [item, ...prev].slice(0, 60);
      save(updated);
      return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => { const u = prev.map(n => ({ ...n, read: true })); save(u); return u; });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => { const u = prev.map(n => n.id === id ? { ...n, read: true } : n); save(u); return u; });
  }, []);

  const clearAll = useCallback(() => { save([]); setNotifications([]); }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, markRead, clearAll }}>
      <PriceAlertWatcher addNotification={addNotification} />
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
