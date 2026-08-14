import type { Address } from "viem";
import { includeAnvilChain } from "./include-anvil";

export type AirlineChainKey = "mainnet" | "sepolia" | "anvil";

export type AirlineChainConfig = {
  key: AirlineChainKey;
  id: number;
  blockExplorer: string | undefined;
  vesselAddress: Address | "";
  boardingPassAddress: Address | "";
  manifestCraftId: number | null;
};

export type AirlineRuntimeChain = {
  vesselAddress: string;
  boardingPassAddress: string;
  manifestCraftId: string;
};

export type EvmAppChain = {
  id: number;
  blockExplorer?: string;
};

export type EvmRuntimeChain = {
  rpcs: string;
  smartAccountRpc: string;
};

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function parseAddress(value: string | undefined): Address | "" {
  if (!value) {
    return "";
  }
  return ADDRESS_RE.test(value) ? (value as Address) : "";
}

export function parseCraftId(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Layer `app.config` `evm.chains` — ids and explorers only. */
export function evmAppChains(): Record<string, EvmAppChain> {
  const chains: Record<string, EvmAppChain> = {
    mainnet: { id: 1, blockExplorer: "https://etherscan.io" },
    sepolia: { id: 11155111, blockExplorer: "https://sepolia.etherscan.io" },
  };
  if (includeAnvilChain) {
    chains.anvil = { id: 31337 };
  }
  return chains;
}

/** Layer `runtimeConfig.public.evm.chains` — RPC slots filled by env. */
export function evmRuntimeChains(): Record<string, EvmRuntimeChain> {
  const empty: EvmRuntimeChain = { rpcs: "", smartAccountRpc: "" };
  const chains: Record<string, EvmRuntimeChain> = {
    mainnet: { ...empty },
    sepolia: { ...empty },
  };
  if (includeAnvilChain) {
    chains.anvil = { ...empty };
  }
  return chains;
}

export function airlineRuntimeChains(): Record<string, AirlineRuntimeChain> {
  const empty: AirlineRuntimeChain = {
    vesselAddress: "",
    boardingPassAddress: "",
    manifestCraftId: "",
  };
  const chains: Record<string, AirlineRuntimeChain> = {
    mainnet: { ...empty },
    sepolia: { ...empty },
  };
  if (includeAnvilChain) {
    chains.anvil = { ...empty };
  }
  return chains;
}

export function resolveAirlineChains(input: {
  evmChains: Record<string, EvmAppChain | undefined>;
  airline: Record<string, AirlineRuntimeChain | undefined>;
}): Map<number, AirlineChainConfig> {
  const map = new Map<number, AirlineChainConfig>();

  for (const [key, evmChain] of Object.entries(input.evmChains)) {
    if (!evmChain?.id) {
      continue;
    }
    const airline = input.airline[key];
    map.set(evmChain.id, {
      key: key as AirlineChainKey,
      id: evmChain.id,
      blockExplorer: evmChain.blockExplorer,
      vesselAddress: parseAddress(airline?.vesselAddress),
      boardingPassAddress: parseAddress(airline?.boardingPassAddress),
      manifestCraftId: parseCraftId(airline?.manifestCraftId),
    });
  }

  return map;
}

export function airlineChainById(
  chains: Map<number, AirlineChainConfig>,
  chainId: number,
): AirlineChainConfig | undefined {
  return chains.get(chainId);
}

export function airlineChainByKey(
  chains: Map<number, AirlineChainConfig>,
  key: AirlineChainKey,
): AirlineChainConfig | undefined {
  for (const chain of chains.values()) {
    if (chain.key === key) {
      return chain;
    }
  }
  return undefined;
}
