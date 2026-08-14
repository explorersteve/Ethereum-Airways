import { describe, expect, it } from "vitest";
import {
  airlineChainById,
  airlineChainByKey,
  parseAddress,
  parseCraftId,
  resolveAirlineChains,
} from "../app/lib/evm/chains";

describe("airline chain mapping", () => {
  const chains = resolveAirlineChains({
    evmChains: {
      mainnet: { id: 1, blockExplorer: "https://etherscan.io" },
      sepolia: { id: 11155111, blockExplorer: "https://sepolia.etherscan.io" },
      anvil: { id: 31337 },
    },
    airline: {
      sepolia: {
        vesselAddress: "0x1bbf5064e2238d9C9D993A6Bc15aE86e6f2f57eC",
        boardingPassAddress: "",
        manifestCraftId: "6675",
      },
    },
  });

  it("maps chain id to key, explorer, and runtime addresses", () => {
    const sepolia = airlineChainById(chains, 11155111);
    expect(sepolia?.key).toBe("sepolia");
    expect(sepolia?.blockExplorer).toBe("https://sepolia.etherscan.io");
    expect(sepolia?.vesselAddress).toBe(
      "0x1bbf5064e2238d9C9D993A6Bc15aE86e6f2f57eC",
    );
    expect(sepolia?.manifestCraftId).toBe(6675);
    expect(airlineChainByKey(chains, "anvil")?.id).toBe(31337);
  });

  it("rejects invalid addresses and craft ids", () => {
    expect(parseAddress("not-an-address")).toBe("");
    expect(parseCraftId("0")).toBeNull();
  });
});
