import {
  airlineChainById,
  airlineChainByKey,
  resolveAirlineChains,
  type AirlineChainConfig,
  type AirlineChainKey,
  type AirlineRuntimeChain,
} from "~/lib/evm/chains";

export function useAirlineChains() {
  const appConfig = useAppConfig();
  const runtimeConfig = useRuntimeConfig();

  const chains = computed(() =>
    resolveAirlineChains({
      evmChains: appConfig.evm?.chains ?? {},
      airline:
        (runtimeConfig.public.airline?.chains as
          | Record<string, AirlineRuntimeChain>
          | undefined) ?? {},
    }),
  );

  const byId = (chainId: number): AirlineChainConfig | undefined =>
    airlineChainById(chains.value, chainId);

  const byKey = (key: AirlineChainKey): AirlineChainConfig | undefined =>
    airlineChainByKey(chains.value, key);

  return { chains, byId, byKey };
}
