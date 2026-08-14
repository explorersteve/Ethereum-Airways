import type { AirlineChainConfig } from "./chains";

function explorerOrigin(blockExplorer: string | undefined): string | undefined {
  if (!blockExplorer) {
    return undefined;
  }
  return blockExplorer.replace(/\/+$/, "");
}

export type BoardingPassExplorerLinks = {
  transaction?: string;
  nft?: string;
  vessel?: string;
};

export function boardingPassExplorerLinks(input: {
  chain: Pick<
    AirlineChainConfig,
    "blockExplorer" | "boardingPassAddress" | "vesselAddress"
  >;
  tokenId: number;
  txHash?: string;
  vesselCraftId?: number;
}): BoardingPassExplorerLinks {
  const origin = explorerOrigin(input.chain.blockExplorer);
  if (!origin) {
    return {};
  }
  const links: BoardingPassExplorerLinks = {};
  if (input.txHash) {
    links.transaction = `${origin}/tx/${input.txHash}`;
  }
  if (input.chain.boardingPassAddress) {
    links.nft = `${origin}/nft/${input.chain.boardingPassAddress}/${input.tokenId}`;
  }
  if (input.chain.vesselAddress && input.vesselCraftId !== undefined) {
    links.vessel = `${origin}/nft/${input.chain.vesselAddress}/${input.vesselCraftId}`;
  }
  return links;
}
