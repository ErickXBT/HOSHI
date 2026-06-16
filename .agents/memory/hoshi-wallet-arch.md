---
name: HOSHI Wallet architecture decisions
description: Key decisions for the HOSHI Wallet app — storage keys, breakpoints, layout logic, RPCs, and features
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
- On mobile: full-height flex column with TopNav + BottomNav

## localStorage keys
- Wallets: `hoshi_wallets_v2` (array of encrypted wallet objects)
- Active wallet ID: `hoshi_active_v2`
- Enabled tokens: `hoshi_enabled_tokens_v1`
- Custom tokens: `hoshi_custom_tokens_v1`
- Settings: `hoshi_settings` (hideBalances, priceAlerts, currency)
- Notifications: `hoshi_notifications_v2` (array of AppNotification, capped at 60)
- Profile photo: `hoshi_profile_photo` (base64 string of uploaded image)

## Fast Refresh rules
- NEVER export hooks alongside a default page component in the same file
- Hooks exported from pages cause HMR invalidation: "new export" warning
- Put shared hooks in dedicated files under `src/hooks/` only

## No backend required
- All pages use `WalletContext` + `usePrices` hooks directly
- Prices from CoinGecko free public API (staleTime 60s)
- Swap quotes from Jupiter API: `https://quote-api.jup.ag/v6/quote`
- Swap execution: POST `https://quote-api.jup.ag/v6/swap`
- News: `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest` (free, no key)
- Polymarket: `https://gamma-api.polymarket.com/markets?limit=30&active=true` (free, no key)
- Token CA lookup (Solana): `https://api.jup.ag/tokens/v1/token/{mint}` (Jupiter)
- Market chart sparkline: `https://api.coingecko.com/api/v3/coins/{id}/market_chart?vs_currency=usd&days=7`
- On-chain balances via public RPCs:
  - ETH: `https://cloudflare-eth.com`
  - SOL: `https://api.mainnet-beta.solana.com`
  - BNB: `https://bsc-dataseed1.binance.org`
  - MATIC: `https://polygon-rpc.com`

## Wallet generation
- EVM (ETH/BNB/MATIC): ethers v6 `HDNodeWallet.createRandom()`
- Solana: SLIP-0010 + `@noble/curves/ed25519.js` (note .js extension required)
- Encryption: AES-GCM via `wallet-crypto.ts`

## Solana TX signing
- For both legacy and versioned (v0) transactions from Jupiter:
  - Sign `txBytes.slice(65)` (skip 1-byte sig count + 64-byte placeholder)
  - Put 64-byte ed25519 sig at `txBytes[1..65]`
- No @solana/web3.js — manual TX building avoids Buffer polyfill issues

## NotificationProvider placement
- Must be inside QueryClientProvider (PriceAlertWatcher uses useCoinPrices → useQuery)
- Price alerts gated by `hoshi_settings.priceAlerts` flag; deduplicated per coin per hour via sessionStorage key `hoshi_alerted`

## Completed pages
- dashboard, send (real SOL + EVM), receive, swap (Jupiter mainnet + CA search modal), portfolio
- add-token (DexScreener CA lookup + toggle popular tokens), history, nfts
- market (live prices + trending + coin detail popup with 7d sparkline chart)
- settings (seed reveal, lock, delete, profile photo upload → base64 localStorage)
- affiliate, news (CryptoCompare), polymarket (Gamma API)

## Navigation
- Sidebar (desktop): mainNav + swapNav + actionNav (includes News, Polymarket) + notification panel (slide-in from right)
- BottomNav (mobile): Send, Receive, Swap (center FAB), Market, Portfolio
- TopNav (mobile): wallet avatar (opens WalletSwitcherSheet) + bell (opens NotificationPanel) + settings + theme toggle

## Assets
- Mascot logo: `@assets/LOGO_HOSHI_SWAP_1781528480848.png`
