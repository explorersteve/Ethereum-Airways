# @1001-digital/layers.evm — inspected surface

Recorded from installed packages, not guessed:

- `@1001-digital/layers.evm@3.0.3`
- `@1001-digital/components.evm@4.0.3` (transitive; do not add as a direct dep)
- `@1001-digital/layers.base@2.1.6` (extended **by the layer**, not by this app)
- `@1001-digital/components` and `@1001-digital/styles` are also transitive via the layer

This app extends **only** `@1001-digital/layers.evm`.

## Layer `nuxt.config.ts`

- `extends: ['@1001-digital/layers.base']`
- `modules: ['@wagmi/vue/nuxt']`
- Registers `components.evm` `src/components` with `pathPrefix: false`
- Marks `clientOnlyComponents` as `mode: 'client'` (SSR-safe placeholders)
- `ssr: process.env.NUXT_SSR !== 'false'`
- `nitro.preset: 'node-cluster'` — this app overrides to `node-server` with `externals.trace: false`. Nitro's node-file trace hung on the WalletConnect graph. SSR stays on.
- Default `runtimeConfig.public.evm`:
  - `walletConnectProjectId: ''`
  - `chains.mainnet.rpcs` / `chains.mainnet.smartAccountRpc`
  - `ens.indexers`
- WalletConnect is added only when `import.meta.client && walletConnectProjectId` (`app/wagmi.ts`)
- `baseAccount` telemetry is disabled to avoid `window` during SSR reconnect

Env mapping (Nuxt public runtime):

| Config path | Env |
| --- | --- |
| `public.evm.walletConnectProjectId` | `NUXT_PUBLIC_EVM_WALLET_CONNECT_PROJECT_ID` |
| `public.evm.chains.mainnet.rpcs` | `NUXT_PUBLIC_EVM_CHAINS_MAINNET_RPCS` |
| `public.evm.chains.sepolia.rpcs` | `NUXT_PUBLIC_EVM_CHAINS_SEPOLIA_RPCS` |
| `public.evm.chains.anvil.rpcs` | `NUXT_PUBLIC_EVM_CHAINS_ANVIL_RPCS` |
| `public.evm.ens.indexers` | `NUXT_PUBLIC_EVM_ENS_INDEXERS` |

RPC strings are whitespace-split. `wss://` → wagmi `webSocket`, otherwise `http`. Layer always appends `unstable_connector(injected)` and a public `http()` fallback.

## Layer `app.config.ts` (`evm`)

| Key | Type / notes |
| --- | --- |
| `title` | string — wallet connector app name |
| `appLogoUrl` | string — shown during connect |
| `defaultChain` | string key into `chains` (wagmi `chains[0]`) |
| `chains` | `Record<string, { id?: number; blockExplorer?: string; smartAccount?: { entryPoint?; implementation?; paymasterContext? } }>` |
| `ens.mode` | `'indexer' \| 'chain'` |
| `ipfsGateway` | must end with `/` |
| `arweaveGateway` | must end with `/` |
| `inAppWallet.enabled` | boolean |
| `safe.description` / `safe.iconPath` | Safe App manifest |

`resolveChain(id)` knows mainnet, sepolia, holesky, optimism(+sepolia), arbitrum, base(+sepolia), polygon, shape(+sepolia), zora(+sepolia), localhost (1337), hardhat (**31337**). Unknown ids become `defineChain({ name: \`Chain ${id}\` })`. Anvil therefore resolves as viem `hardhat`.

## Auto-imported composables (layer re-exports)

From `layers.evm/app/composables`:

| Export | Source |
| --- | --- |
| `useEvmConfig` | `components.evm` inject (`EvmConfigKey`) |
| `useChainConfig(key?)` | `{ id, blockExplorer }` from app config; numeric key skips lookup |
| `useMainChainId` | `useChainConfig().id` |
| `useBlockExplorer(key?)` | explorer URL |
| `useEnsureChainIdCheck(key?)` | switches wallet to configured chain |
| `useEns` / `useEnsWithAvatar` / `useEnsProfile` / `useEnsResolver` | ENS |
| `useAmountInput` / `normalizeAmountInput` / `parseAmountInput` | token amounts |
| `useEthAmountInput` / `normalizeEthAmountInput` / `parseEthAmountInput` | ETH amounts |
| `useMediaInfo` | media |
| `useDwebClient` / `useResolvedUrl` | IPFS/Arweave URLs |
| `useGasPrice` / `usePriceFeed` | pricing |
| `useWalletExplorer` | explorer wallet list |
| `useBaseURL` | app base URL |
| SIWE helpers | present; this product does not use SIWE |

Utils also re-exported: `EvmConfigKey`, `defaultEvmConfig`, `resolveChain`.

There is **no** composable named `useConfig`. Use `useEvmConfig` / `useAppConfig` / `useRuntimeConfig`.

## Components (global + `#components`)

Client-only (layer `client-only.ts`): `EvmAccount`, `EvmAddressInput`, `EvmArtifactModel`, `EvmAvatar`, `EvmConnect`, `EvmConnectAuth`, `EvmConnectAuthDialog`, `EvmConnectDialog`, `EvmConnectionStatus`, `EvmConnectorQR`, `EvmInAppWalletSetup`, `EvmMetaMaskQR`, `EvmProfile`, `EvmSidebarProfile`, `EvmSiwe`, `EvmSiweDialog`, `EvmSwitchNetwork`, `EvmMultiTransactionFlow`, `EvmMultiTransactionFlowDialog`, `EvmTransactionFlow`, `EvmTransactionFlowDialog`, `EvmWalletConnectQR`, `EvmWalletConnectWallets`.

### Used on the plan 01 index page

**`EvmConnectDialog`**

- Props: `className?: string`, `connectorFilter?: 'all' \| 'external' \| 'in-app'`, `inAppWalletInitialStep?: 'choose' \| 'create' \| 'restore'`
- Default slot: disconnected trigger label (default text `Connect Wallet`)
- Slot `#connected` props: `{ address }`
- Emits: `connected` `{ address }`, `disconnected`, `back`

**`EvmProfile`**

- Props: `className?: string`
- Default slot props: `{ address, display, ensName, ensAvatar }`
- Slot `#actions` props: `{ ens, address }`
- Emits: `disconnected`
- Includes its own `EvmSwitchNetwork` inside the account dialog

**`EvmAccount`**

- Props: `address?: Address`, `resolveEns?: boolean` (template: `resolve-ens`)
- Default slot props: `{ display, ens, isCurrent }`

**`EvmSwitchNetwork`**

- Props: `className?: string`
- Default slot props: `{ currentChain }` (viem `Chain`)
- Emits: `switched` `{ chainId, name }`, `error` `{ message }`
- Renders nothing when `config.chains.length <= 1`

### Other exported components (for later plans)

| Component | Props (from `types.ts`) | Notes |
| --- | --- | --- |
| `EvmConnect` | `connectorFilter`, `inAppWalletInitialStep` | emits `connecting`, `connected`, `back` |
| `EvmConnectionStatus` | none | slot `{ status, address, connector }` |
| `EvmAvatar` | `address`, `large` | |
| `EvmAddressInput` | `placeholder` | |
| `EvmAmountInput` | `decimals`, `symbol`, `balance`, `placeholder` | emit `max` |
| `EvmEthInput` | `placeholder`, `suffix`, `balance` | |
| `EvmArtifact` | `metadata`, `image`, `animationUrl`, `name`, `backgroundColor`, `useBackgroundColor`, `aspectRatio`, `controls`, `muted`, `scroll`, `width`, `height` | |
| `EvmTransactionFlow` | `chain`, `text`, `request`, `delayAfter`, `delayAutoclose`, `skipConfirmation`, `autoCloseSuccess`, `dismissable`, `keepOpen` | |
| `EvmTransactionFlowDialog` | same as flow | |
| `EvmMultiTransactionFlow` | `steps`, `chain`, `text`, delays, skip/auto/dismiss flags | |
| `EvmSidebarProfile` | none typed | emit `disconnected` |
| SIWE / ConnectAuth / in-app setup | see `types.ts` | unused (no SIWE, `inAppWallet.enabled: false`) |

## SSR notes

- Do not read `window` at module scope. The layer already gates WalletConnect on `isClient`.
- Connect/profile/switch components are client-only; they hydrate after mount.
- Prefer `#connected` on `EvmConnectDialog` rather than calling wagmi hooks at page module scope.
