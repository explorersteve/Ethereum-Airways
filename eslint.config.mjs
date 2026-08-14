import convex from "@convex-dev/eslint-plugin";
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  ...convex.configs.recommended,
  {
    ignores: [
      "contracts/**",
      "docs/**",
      "plans/**",
      "convex/_generated/**",
      "app/lib/evm/abi/**",
    ],
  },
);
