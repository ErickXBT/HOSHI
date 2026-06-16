import { useState, useCallback } from "react";

const STORAGE_KEY = "hoshi_enabled_tokens_v1";
const CUSTOM_KEY = "hoshi_custom_tokens_v1";

export const DEFAULT_ENABLED: Record<string, boolean> = {
  bitcoin: false,
  ethereum: true,
  solana: true,
  binancecoin: true,
  "matic-network": false,
  arbitrum: false,
  optimism: false,
  tether: false,
  "usd-coin": false,
};

export interface CustomToken {
  id: string;
  address: string;
  symbol: string;
  name: string;
  chain: string;
  price: number;
  change24h: number;
  logo: string | null;
}

export function loadEnabled(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_ENABLED, ...JSON.parse(raw) } : { ...DEFAULT_ENABLED };
  } catch {
    return { ...DEFAULT_ENABLED };
  }
}

export function saveEnabled(enabled: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
}

export function loadCustomTokens(): CustomToken[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomTokens(tokens: CustomToken[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(tokens));
}

export function useEnabledTokens() {
  const [enabled, setEnabledState] = useState<Record<string, boolean>>(loadEnabled);

  const setEnabled = useCallback((id: string, val: boolean) => {
    setEnabledState(prev => {
      const next = { ...prev, [id]: val };
      saveEnabled(next);
      return next;
    });
  }, []);

  return { enabled, setEnabled };
}

export async function lookupTokenByCA(ca: string): Promise<CustomToken | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`);
    if (!res.ok) return null;
    const data = await res.json() as {
      pairs?: Array<{
        chainId: string;
        baseToken: { address: string; symbol: string; name: string };
        priceUsd?: string;
        priceChange?: { h24?: number };
        info?: { imageUrl?: string };
      }>;
    };
    const pair = data.pairs?.[0];
    if (!pair) return null;
    return {
      id: `custom_${ca.slice(0, 8).toLowerCase()}`,
      address: ca,
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      chain: pair.chainId,
      price: pair.priceUsd ? parseFloat(pair.priceUsd) : 0,
      change24h: pair.priceChange?.h24 ?? 0,
      logo: pair.info?.imageUrl ?? null,
    };
  } catch {
    return null;
  }
}
