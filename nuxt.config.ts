import { airlineRuntimeChains, evmRuntimeChains } from "./app/lib/evm/chains";

const convexUrl =
  process.env.NUXT_PUBLIC_CONVEX_URL ||
  "https://diligent-seahorse-531.convex.cloud";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  extends: ["@1001-digital/layers.evm"],
  modules: ["convex-nuxt", "@nuxt/eslint"],
  css: ["~/assets/css/airline.css"],
  app: {
    head: {
      title: "Ethereum Airways",
      htmlAttrs: { lang: "en" },
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/icon.svg" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap",
        },
      ],
    },
  },
  convex: {
    url: convexUrl,
  },
  // layers.evm defaults to node-cluster. That preset plus Nitro's node-file
  // trace hangs on the WalletConnect graph. node-server + no trace keeps SSR
  // on and lets Node resolve those packages from node_modules at runtime.
  nitro: {
    preset: "node-server",
    externals: {
      trace: false,
    },
  },
  runtimeConfig: {
    public: {
      convexUrl,
      evm: {
        walletConnectProjectId: "",
        chains: evmRuntimeChains(),
        ens: {
          indexers: "",
        },
      },
      airline: {
        chains: airlineRuntimeChains(),
      },
    },
  },
});
