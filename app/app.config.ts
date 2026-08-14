import { evmAppChains } from "./lib/evm/chains";

export default defineAppConfig({
  evm: {
    title: "Ethereum Airways",
    appLogoUrl: "/icon.svg",
    defaultChain: "sepolia",
    chains: evmAppChains(),
    inAppWallet: { enabled: false },
  },
});
