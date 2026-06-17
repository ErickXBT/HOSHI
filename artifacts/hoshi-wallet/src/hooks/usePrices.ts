import { useQuery } from "@tanstack/react-query";

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}

export interface MarketOverview {
  totalMarketCapUsd: number;
  change24hPct: number;
  btcDominancePct: number;
  ethDominancePct: number;
  volume24hUsd: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  price: number;
  change24h: number;
}

const COIN_IDS = "bitcoin,ethereum,solana,binancecoin,matic-network,arbitrum,optimism,tether,usd-coin";
const BASE = "https://api.coingecko.com/api/v3";
const STALE_TIME = 60_000;

export function useCoinPrices() {
  return useQuery<CoinPrice[]>({
    queryKey: ["coin-prices"],
    queryFn: async () => {
      const res = await fetch(
        `${BASE}/coins/markets?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc&per_page=20&sparkline=false&price_change_percentage=24h`
      );
      if (!res.ok) throw new Error("CoinGecko error");
      return res.json();
    },
    staleTime: STALE_TIME,
    retry: 2,
  });
}

export function useMarketOverview() {
  return useQuery<MarketOverview>({
    queryKey: ["market-overview"],
    queryFn: async () => {
      const [globalRes, fearRes] = await Promise.allSettled([
        fetch(`${BASE}/global`).then(r => r.json()),
        fetch(`https://api.alternative.me/fng/?limit=1`).then(r => r.json()),
      ]);
      const global = globalRes.status === "fulfilled" ? globalRes.value?.data : null;
      const fear = fearRes.status === "fulfilled" ? fearRes.value?.data?.[0] : null;
      return {
        totalMarketCapUsd: global?.total_market_cap?.usd ?? 2.4e12,
        change24hPct: global?.market_cap_change_percentage_24h_usd ?? 0,
        btcDominancePct: global?.market_cap_percentage?.btc ?? 52,
        ethDominancePct: global?.market_cap_percentage?.eth ?? 17,
        volume24hUsd: global?.total_volume?.usd ?? 1.2e11,
        fearGreedIndex: Number(fear?.value ?? 65),
        fearGreedLabel: fear?.value_classification ?? "Greed",
      };
    },
    staleTime: STALE_TIME * 5,
    retry: 1,
  });
}

export function useTrendingCoins() {
  return useQuery<TrendingCoin[]>({
    queryKey: ["trending-coins"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/search/trending`);
      if (!res.ok) throw new Error("Trending error");
      const data = await res.json();
      return (data?.coins ?? []).slice(0, 7).map((c: any) => ({
        id: c.item.id,
        name: c.item.name,
        symbol: c.item.symbol,
        thumb: c.item.thumb,
        price: c.item.data?.price ?? 0,
        change24h: c.item.data?.price_change_percentage_24h?.usd ?? 0,
      }));
    },
    staleTime: STALE_TIME * 5,
    retry: 1,
  });
}

export function usePriceMap() {
  const { data: prices } = useCoinPrices();
  const map: Record<string, number> = {};
  if (prices) {
    for (const p of prices) {
      map[p.symbol.toUpperCase()] = p.current_price;
    }
  }
  return map;
}

export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amountLamports: number,
  slippageBps = 50
) {
  const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=${slippageBps}&onlyDirectRoutes=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Jupiter quote error");
  return res.json();
}

const SOL_RPCS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
  "https://solana-api.projectserum.com",
];

export async function getSolBalance(solAddress: string): Promise<number> {
  if (!solAddress) return 0;
  for (const rpc of SOL_RPCS) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [solAddress, { commitment: "confirmed" }],
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.result?.value != null) {
        return data.result.value / 1e9;
      }
    } catch {}
  }
  return 0;
}
