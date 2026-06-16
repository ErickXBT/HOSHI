---
name: "@noble/curves subpath import fix"
description: "@noble/curves v2.2.0 exports ed25519 as ./ed25519.js not ./ed25519 — use the .js extension"
---

In `@noble/curves` v2.2.0, the package.json exports map uses `.js` extensions for all subpath exports (e.g. `./ed25519.js`, `./secp256k1.js`). Vite cannot resolve `@noble/curves/ed25519` without the extension.

**Rule:** Always import as `import { ed25519 } from "@noble/curves/ed25519.js"` (with `.js`).

**Why:** The exports map key is `"./ed25519.js"` not `"./ed25519"`. Without the extension, Vite's module resolver throws `Missing "./ed25519" specifier in "@noble/curves" package`.

**How to apply:** Any time you add a `@noble/curves` subpath import, include the `.js` extension.
