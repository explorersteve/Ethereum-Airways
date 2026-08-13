# Plan 00 — Repo scaffold, Foundry, git

## Goal

Turn the empty folder into a working monorepo-lite: git repo, Nuxt 4 app at root, Foundry
project under `contracts/`, Convex wired to the existing deployment, shared scripts.
Nothing product-specific yet.

## Prerequisites

None.

## Tasks

1. `git init`, set default branch `main`. Add `.gitignore` covering `node_modules`, `.nuxt`,
   `.output`, `dist`, `.env*` (except `.env.example`), `contracts/out`, `contracts/cache`,
   `contracts/broadcast`, `.convex`, `coverage`.
2. Scaffold Nuxt 4 at repo root with pnpm (`pnpm dlx nuxi init . --package-manager pnpm --git-init false`).
   Keep the Nuxt 4 `app/` directory convention.
3. Move the build brief into `docs/brief.md` so the repo root stays clean. Keep `plans/` at root.
4. Initialize Foundry in `contracts/`:
   - `forge init contracts --no-git --no-commit`
   - remove the template `Counter.sol` / `Counter.t.sol` / `Counter.s.sol`
   - `forge install OpenZeppelin/openzeppelin-contracts@v5` (pin the exact 5.x tag resolved)
   - `foundry.toml`: `solc = "0.8.28"`, `optimizer = true`, `optimizer_runs = 200`,
     `remappings = ["@openzeppelin/=lib/openzeppelin-contracts/"]`, `fs_permissions` for
     deployment JSON output, `[fmt]` with `line_length = 110`, `[profile.default.fuzz] runs = 512`,
     `[profile.default.invariant] runs = 128, depth = 64`.
   - `[rpc_endpoints]` for `mainnet` and `sepolia` reading `${ETHEREUM_RPC_URL}` / `${SEPOLIA_RPC_URL}`.
5. Create `src/` subfolders in contracts: `interfaces/`, `libraries/`, `mocks/`.
6. Add root `package.json` scripts: `dev`, `build`, `preview`, `typecheck` (`nuxt typecheck`),
   `lint`, `test` (vitest), `convex:dev`, `contracts:build`, `contracts:test`, `contracts:fmt`,
   `anvil`, `abi:sync` (placeholder, implemented in plan 12).
7. Add `.env.example` with every variable the project will use (values empty):
   `NUXT_PUBLIC_EVM_WALLET_CONNECT_PROJECT_ID`, `NUXT_PUBLIC_EVM_CHAINS_MAINNET_RPCS`,
   `NUXT_PUBLIC_EVM_CHAINS_SEPOLIA_RPCS`, `NUXT_PUBLIC_CHAIN_ID`,
   `NUXT_PUBLIC_BOARDING_PASS_ADDRESS`, `NUXT_PUBLIC_VESSEL_ADDRESS`,
   `NUXT_PUBLIC_VESSEL_CRAFT_ID`, `NUXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`,
   `ETHEREUM_RPC_URL`, `SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `ETHERSCAN_API_KEY`,
   `TREASURY_ADDRESS`.
8. Install Convex: `pnpm add convex convex-nuxt`. Do **not** run `convex dev` codegen yet
   (plan 09 owns the schema); just record `CONVEX_URL=https://diligent-seahorse-531.convex.cloud`
   in `.env.example` comments alongside the HTTP actions URL
   `https://diligent-seahorse-531.convex.site`.
9. Install test tooling: `pnpm add -D vitest @vue/test-utils @nuxt/test-utils happy-dom`.
   Minimal `vitest.config.ts`. One smoke test so `pnpm test` exits 0.
10. Add ESLint via `pnpm add -D @nuxt/eslint` module, default flat config.

## Files created

```
.gitignore
.env.example
package.json
nuxt.config.ts
vitest.config.ts
eslint.config.mjs
app/app.vue
docs/brief.md
contracts/foundry.toml
contracts/src/{interfaces,libraries,mocks}/.gitkeep
contracts/lib/openzeppelin-contracts
```

## Verification

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
cd contracts && forge build && forge test && forge fmt --check
```

## Done criteria

- All six commands above exit 0.
- `git status` shows no ignored build artifacts staged.
- OpenZeppelin resolves at a pinned 5.x tag, recorded in the plan log.
- No React/Next dependency anywhere in the lockfile.

## Commit

`chore: scaffold nuxt app, foundry project, and shared tooling`

## Plan log

- Executed 2026-08-13.
- OpenZeppelin Contracts pinned at **v5.7.0** (`forge install OpenZeppelin/openzeppelin-contracts@v5.7.0 --no-git`).
- Nuxt **4.5.2**, Vue **3.5.41**, pnpm **10.22.0**, forge **1.7.1**.
- Convex packages installed only (`convex@1.44.0`, `convex-nuxt@0.1.5`); no `convex dev` codegen (plan 09).
