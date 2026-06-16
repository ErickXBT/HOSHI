import { useState, useEffect } from "react";

export interface TrendingPool {
  name: string;
  symbol: string;
  address: string;
  priceUsd: string;
  change24h: number;
  volume24h: number;
  chainId: string;
  logo: string | null;
  dexUrl: string;
}

const NETWORK_MAP: Record<string, string> = { sol: "solana", base: "base", bnb: "bsc" };
const DSCHAIN_MAP: Record<string, string> = { sol: "solana", base: "base", bnb: "bsc" };

async function fetchGeckoTrending(network: string): Promise<TrendingPool[]> {
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${NETWORK_MAP[network]}/trending_pools?page=1&include=base_token`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return [];
    const json = await res.json() as {
      data: Array<{
        attributes: {
          name: string;
          address: string;
          base_token_price_usd: string;
          price_change_percentage: { h24?: string };
          volume_usd: { h24?: string };
        };
        relationships: { base_token: { data: { id: string } } };
      }>;
      included?: Array<{
        id: string;
        type: string;
        attributes: { symbol: string; image_url?: string | null };
      }>;
    };

    const tokenMap = new Map<string, { symbol: string; image_url?: string | null }>();
    for (const inc of json.included ?? []) {
      if (inc.type === "token") tokenMap.set(inc.id, inc.attributes);
    }

    return (json.data ?? []).slice(0, 10).map(pool => {
      const tokenId = pool.relationships.base_token.data.id;
      const tokenMeta = tokenMap.get(tokenId);
      const rawName = pool.attributes.name ?? "";
      const symbol = tokenMeta?.symbol ?? rawName.split(" / ")[0] ?? "?";
      return {
        name: rawName,
        symbol,
        address: pool.attributes.address,
        priceUsd: pool.attributes.base_token_price_usd ?? "0",
        change24h: parseFloat(pool.attributes.price_change_percentage?.h24 ?? "0"),
        volume24h: parseFloat(pool.attributes.volume_usd?.h24 ?? "0"),
        chainId: network,
        logo: tokenMeta?.image_url ?? null,
        dexUrl: `https://dexscreener.com/${DSCHAIN_MAP[network]}/${pool.attributes.address}`,
      };
    });
  } catch {
    return [];
  }
}

export function useTrending(chain: "sol" | "base" | "bnb") {
  const [data, setData] = useState<TrendingPool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData([]);
    fetchGeckoTrending(chain).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [chain]);

  return { data, loading };
}
