---
name: HOSHI Wallet architecture decisions
description: Key decisions for the HOSHI Wallet app — storage keys, breakpoints, layout logic, RPCs
---

## Branding
- App name: **HOSHI Swap** (not Wallet)
- New logo: `@assets/LOGO_HOSHI_SWAP_1781600746164.png` (black cat, sticker style)
- Favicon: `public/favicon.png` (copied from attached_assets)

## Database sync
- DB table: `hoshi_wallets` (added via drizzle push, schema in `lib/db/src/schema/hoshi-wallets.ts`)
- Device ID: random UUID generated once, stored in `localStorage` under `hoshi_device_id`
- Wallets fetched from DB on startup by deviceId, merged with localStorage cache
- All mutations (create/import/delete) sync to DB via `/api/hoshi-wallets`
- Vite proxy: `/api` → `http://localhost:8080` (added to vite.config.ts server.proxy)
- Encrypted blob stored in DB — private keys NEVER leave client unencrypted
- 502 on /api is harmless — localStorage is primary, DB sync is optional

## Layout logic (App.tsx)
- Desktop breakpoint: `1024px` (`useIsDesktop` in `use-mobile.tsx`)
- On desktop: always render full-width (no 390px container), even for login page
- On desktop + logged in + not on login page: sidebar (256px) + scrollable content area
- On mobile: `bg-black` wrapper + `max-w-[390px]` phone frame + shadow

## localStorage keys
- Wallets: `hoshi_wallets_v2` (array of encrypted wallet objects)
- Active wallet ID: `hoshi_active_v2`
- Enabled tokens: `hoshi_enabled_tokens_v1`
- Custom tokens: `hoshi_custom_tokens_v1`
- Settings: `hoshi_settings`

## Fast Refresh rules
- NEVER export hooks alongside a default page component in the same file
- Hooks exported from pages cause HMR invalidation: "new export" warning
- Put shared hooks in dedicated files under `src/hooks/` only

## No backend required
- All pages use `WalletContext` + `usePrices` hooks directly
- Prices from CoinGecko free public API (staleTime 60s)
- Swap quotes from Jupiter API: `https://quote-api.jup.ag/v6/quote`
- Swap execution: POST `https://quote-api.jup.ag/v6/swap`
- On-chain balances via public RPCs:
  - ETH: `https://cloudflare-eth.com`
  - SOL: `https://api.mainnet-beta.solana.com`
  - BNB: `https://bsc-dataseed1.binance.org`
  - MATIC: `https://polygon-rpc.com`
- Token CA lookup: `https://api.dexscreener.com/latest/dex/tokens/{ca}`

## Wallet generation
- EVM (ETH/BNB/MATIC): ethers v6 `HDNodeWallet.createRandom()`
- Solana: SLIP-0010 + `@noble/curves/ed25519.js` (note .js extension required)
- Encryption: AES-GCM via `wallet-crypto.ts`

## Solana TX signing
- For both legacy and versioned (v0) transactions from Jupiter:
  - Sign `txBytes.slice(65)` (skip 1-byte sig count + 64-byte placeholder)
  - Put 64-byte ed25519 sig at `txBytes[1..65]`
- No @solana/web3.js — manual TX building avoids Buffer polyfill issues

## Completed pages
- dashboard, send (real SOL + EVM), receive, swap (Jupiter mainnet), portfolio
- add-token (DexScreener CA lookup + toggle popular tokens), history, nfts, market
- settings (seed reveal, lock, delete), affiliate

## Assets
- Mascot logo: `@assets/LOGO_HOSHI_SWAP_1781528480848.png`
