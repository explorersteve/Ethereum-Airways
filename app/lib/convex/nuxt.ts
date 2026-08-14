/**
 * Confirmed from convex-nuxt@0.1.5 `addImports` (convex-vue):
 * useConvexQuery, useConvexMutation, useConvexHttpQuery, useConvexClient.
 * There is no useConvexAction — use useConvexMutation or the client.
 */
export const CONVEX_NUXT_COMPOSABLES = [
  "useConvexQuery",
  "useConvexMutation",
  "useConvexHttpQuery",
  "useConvexClient",
] as const;
