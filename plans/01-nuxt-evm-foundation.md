# Plan 01 — Nuxt EVM foundation and chain config

## Goal

Install and configure `@1001-digital/layers.evm` as the app's EVM foundation, with mainnet,
Sepolia, and local Anvil chains, and prove a wallet can connect and switch networks.

## Prerequisites

Plan 00 done.

## Tasks

1. `pnpm add @1001-digital/layers.evm`, plus `pnpm add viem @wagmi/core` (app code will import
   both directly in plans 12–13, so they are declared dependencies).
2. **Inspect the installed layer before writing config.** Read
   `node_modules/@1001-digital/layers.evm` — `nuxt.config.ts`, `app.config.ts`, the components
   directory, and the composables (`useConfig`, connect/transaction composables). Record the exact
   exported component names, props, slots, and config keys in `docs/1001-layer-notes.md`.
   Never guess a prop name that can be read from source.
3. `nuxt.config.ts`: `extends: ['@1001-digital/layers.evm']`. Do not also extend `layers.base`.
   Add `modules: ['convex-nuxt', '@nuxt/eslint']` and the Convex `url` from runtime config.
4. `runtimeConfig.public.evm` with `walletConnectProjectId`, `chains.mainnet.rpcs`,
   `chains.sepolia.rpcs`, `ens.indexers` — all empty strings so env vars fill them.
5. `app.config.ts`:
   ```ts
   evm: {
     title: 'Ethereum Airways',
     appLogoUrl: '/icon.svg',
     defaultChain: 'sepolia',
     chains: {
       mainnet: { id: 1, blockExplorer: 'https://etherscan.io' },
       sepolia: { id: 11155111, blockExplorer: 'https://sepolia.etherscan.io' },
     },
     inAppWallet: { enabled: false },
   }
   ```
   Add an `anvil` chain entry only when `NODE_ENV !== 'production'` (local dev convenience,
   chain id 31337, explorer omitted). Keep the gate in one place.
   Adjust key names to whatever the inspected layer actually expects.
6. `app/lib/evm/chains.ts`: single source mapping chain id → key, explorer URL, Vessel address,
   BoardingPass address, and manifest craft id, all read from runtime config. Nothing else in the
   app hardcodes an address.
7. Temporary `app/pages/index.vue` with only the wallet surface: `EvmConnectDialog` with a
   `#connected` slot rendering `EvmProfile` + `EvmAccount resolve-ens`, and `EvmSwitchNetwork`.
   This page is replaced in plan 10; it exists now to validate the foundation.
8. Confirm SSR safety: no `window` access at module scope; wrap anything provider-dependent per
   the layer's own patterns.

## Verification

```bash
pnpm typecheck
pnpm dev
```

Manual checks in the browser:
- Disconnected trigger renders and opens the wallet selection dialog.
- Connect with a browser wallet on Sepolia; address renders in the connected slot.
- Switch to mainnet and back via `EvmSwitchNetwork`.
- Reload with SSR enabled — no hydration errors, no `window is not defined` in the server log.

## Done criteria

- `docs/1001-layer-notes.md` lists the real component/prop/config surface, no invented names.
- Connect, profile, and network switch all work on Sepolia and mainnet.
- `pnpm build` succeeds with SSR on.
- `@1001-digital/components`, `components.evm`, `styles`, and `layers.base` are **not** direct
  dependencies.

## Commit

`feat: add 1001 evm layer foundation with mainnet, sepolia, and anvil chains`
