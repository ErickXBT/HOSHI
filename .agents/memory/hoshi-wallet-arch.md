---
name: HOSHI Wallet architecture decisions
description: Key decisions for the HOSHI Wallet app — storage keys, breakpoints, layout logic, RPCs
---

## Layout logic (App.tsx)
- Desktop breakpoint: `1024px` (`useIsDesktop` in `use-mobile.tsx`)
- On desktop: always render full-width (no 390px container), even for login page
- On desktop + logged in + not on login page: sidebar (256px) + scrollable content area
- On mobile: `bg-black` wrapper + `max-w-[390px]` phone frame + shadow

## localStorage keys
- Wallets: `hoshi_wallets_v2` (array of encrypted wallet objects)
- Active wallet ID: `hoshi_active_v2`

## No backend required
- All pages use `WalletContext` + `usePrices` hooks directly
- Prices from CoinGecko free public API (staleTime 60s)
- Swap quotes from Jupiter API: `https://quote-api.jup.ag/v6/quote`
- On-chain balances via public RPCs:
  - ETH: `https://cloudflare-eth.com`
  - SOL: `https://api.mainnet-beta.solana.com`
  - BNB: `https://bsc-dataseed1.binance.org`
  - MATIC: `https://polygon-rpc.com`

## Wallet generation
- EVM (ETH/BNB/MATIC): ethers v6 `HDNodeWallet.createRandom()`
- Solana: SLIP-0010 + `@noble/curves/ed25519.js` (note .js extension required)
- Encryption: AES-GCM via `wallet-crypto.ts`

## Assets
- Mascot logo: `@assets/LOGO_HOSHI_SWAP_1781528480848.png`
