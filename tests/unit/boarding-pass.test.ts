import { encodeAbiParameters, encodeEventTopics, type Hex, type Log } from "viem";
import { describe, expect, it, vi } from "vitest";
import { boardingPassAbi } from "../../app/lib/evm/abi/boardingPass";
import {
  parseDeploymentRecord,
  startBlockFromDeployment,
} from "../../app/lib/evm/deployments";
import { boardingPassExplorerLinks } from "../../app/lib/evm/explorer";
import { finalizeMint } from "../../app/lib/evm/finalizeMint";
import { classifyPassReadError, parseTokenIdParam } from "../../app/lib/evm/passRead";
import {
  BoardingPassMintedLogNotFoundError,
  decodeBoardingPassMinted,
} from "../../app/lib/evm/receipt";
import { decodeOnchainTokenUri } from "../../app/lib/evm/tokenUri";
import { formatTxHash } from "../../app/lib/format/address";

const CONTRACT = "0x00000000000000000000000000000000000000a1" as const;
const OTHER = "0x00000000000000000000000000000000000000b1" as const;
const TRAVELER = "0x00000000000000000000000000000000000000c1" as const;
const TX =
  "0x1111111111111111111111111111111111111111111111111111111111111111" as Hex;

function mintedLog(address = CONTRACT): Log {
  const topics = encodeEventTopics({
    abi: boardingPassAbi,
    eventName: "BoardingPassMinted",
    args: {
      traveler: TRAVELER,
      tokenId: 121n,
      seatId: 121,
    },
  });
  const data = encodeAbiParameters(
    [
      { type: "uint256" },
      { type: "uint16" },
      { type: "uint256" },
      { type: "uint256" },
    ],
    [20_000_000_000_000_000n, 1, 6675n, 1n],
  );
  return {
    address,
    blockHash: TX,
    blockNumber: 12n,
    data,
    logIndex: 2,
    removed: false,
    topics,
    transactionHash: TX,
    transactionIndex: 0,
  };
}

const transferAbi = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
] as const;

function transferLog(): Log {
  const topics = encodeEventTopics({
    abi: transferAbi,
    eventName: "Transfer",
    args: {
      from: "0x0000000000000000000000000000000000000000",
      to: TRAVELER,
      tokenId: 121n,
    },
  });
  return {
    address: CONTRACT,
    blockHash: TX,
    blockNumber: 12n,
    data: "0x",
    logIndex: 0,
    removed: false,
    topics,
    transactionHash: TX,
    transactionIndex: 0,
  };
}

describe("decodeBoardingPassMinted", () => {
  it("finds BoardingPassMinted by contract address, not log index 0", () => {
    const decoded = decodeBoardingPassMinted(
      { logs: [transferLog(), mintedLog(OTHER), mintedLog()] },
      CONTRACT,
    );
    expect(decoded.tokenId).toBe(121);
    expect(decoded.seatId).toBe(121);
    expect(decoded.bagCount).toBe(1);
    expect(decoded.vesselCraftId).toBe(6675);
    expect(decoded.vesselEntry).toBe(1);
    expect(decoded.totalPaid).toBe(20_000_000_000_000_000n);
  });

  it("throws when the minted log is missing", () => {
    expect(() =>
      decodeBoardingPassMinted({ logs: [transferLog(), mintedLog(OTHER)] }, CONTRACT),
    ).toThrow(BoardingPassMintedLogNotFoundError);
  });
});

describe("onchain tokenURI", () => {
  it("decodes base64 JSON and returns the image data URI", () => {
    const metadata = {
      name: "Boarding Pass · Seat 12A",
      image: "data:image/svg+xml;base64,PHN2Zy8+",
    };
    const tokenUri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
    expect(decodeOnchainTokenUri(tokenUri)).toEqual(metadata);
  });
});

describe("explorer links", () => {
  it("builds sepolia and mainnet URLs from configured explorers", () => {
    const sepolia = boardingPassExplorerLinks({
      chain: {
        blockExplorer: "https://sepolia.etherscan.io",
        boardingPassAddress: CONTRACT,
        vesselAddress: OTHER,
      },
      tokenId: 121,
      txHash: TX,
      vesselCraftId: 6675,
    });
    expect(sepolia.transaction).toBe(`https://sepolia.etherscan.io/tx/${TX}`);
    expect(sepolia.nft).toBe(`https://sepolia.etherscan.io/nft/${CONTRACT}/121`);
    expect(sepolia.vessel).toBe(`https://sepolia.etherscan.io/nft/${OTHER}/6675`);

    const mainnet = boardingPassExplorerLinks({
      chain: {
        blockExplorer: "https://etherscan.io",
        boardingPassAddress: CONTRACT,
        vesselAddress: OTHER,
      },
      tokenId: 12,
      txHash: TX,
      vesselCraftId: 6669,
    });
    expect(mainnet.transaction).toBe(`https://etherscan.io/tx/${TX}`);
    expect(mainnet.nft).toBe(`https://etherscan.io/nft/${CONTRACT}/12`);
    expect(mainnet.vessel).toBe(`https://etherscan.io/nft/${OTHER}/6669`);
  });

  it("omits links when the explorer or address is unset (anvil)", () => {
    expect(
      boardingPassExplorerLinks({
        chain: {
          blockExplorer: undefined,
          boardingPassAddress: CONTRACT,
          vesselAddress: OTHER,
        },
        tokenId: 121,
        txHash: TX,
        vesselCraftId: 6675,
      }),
    ).toEqual({});
  });
});

describe("missing token and finalizeMint", () => {
  it("classifies ERC721NonexistentToken as missing, other errors as rpc", () => {
    expect(
      classifyPassReadError({
        name: "ContractFunctionExecutionError",
        cause: { data: { errorName: "ERC721NonexistentToken" } },
      }),
    ).toBe("missing");
    expect(classifyPassReadError(new Error("HTTP 429"))).toBe("rpc");
    expect(parseTokenIdParam("121")).toBe(121);
    expect(parseTokenIdParam("0")).toBeNull();
    expect(parseTokenIdParam("abc")).toBeNull();
  });

  it("does not treat a Convex write failure as a failed booking", async () => {
    const receipt = {
      transactionHash: TX,
      from: TRAVELER,
      logs: [transferLog(), mintedLog()],
    } as never;
    const result = await finalizeMint({
      receipt,
      contractAddress: CONTRACT,
      chainId: 11155111,
      recordMint: async () => {
        throw new Error("Convex unavailable");
      },
    });
    expect(result.logMissing).toBe(false);
    expect(result.recorded).toBe(false);
    expect(result.minted?.tokenId).toBe(121);
  });

  it("records when Convex succeeds", async () => {
    const recordMint = vi.fn().mockResolvedValue("mint-id");
    const receipt = {
      transactionHash: TX,
      from: TRAVELER,
      logs: [mintedLog()],
    } as never;
    const result = await finalizeMint({
      receipt,
      contractAddress: CONTRACT,
      chainId: 11155111,
      recordMint,
    });
    expect(result.recorded).toBe(true);
    expect(recordMint).toHaveBeenCalledOnce();
  });
});

describe("deployment start block", () => {
  it("reads the start block from deployments JSON and rejects genesis", () => {
    const record = parseDeploymentRecord({
      chainId: 11155111,
      boardingPass: CONTRACT,
      renderer: OTHER,
      vessel: OTHER,
      vesselCraftId: 6675,
      deploymentBlock: 8_424_001,
    });
    expect(startBlockFromDeployment(record)).toBe(8_424_001);
    expect(() =>
      parseDeploymentRecord({
        chainId: 11155111,
        boardingPass: CONTRACT,
        deploymentBlock: 0,
      }),
    ).toThrow(/never genesis/);
  });
});

describe("tx hash display", () => {
  it("shortens a 32-byte hash", () => {
    expect(formatTxHash(TX)).toBe("0x1111…1111");
  });
});

describe("tokenURI fixture render payload", () => {
  it("yields an img-ready data URI from a mocked tokenURI", () => {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg'><text>12A</text></svg>";
    const image = `data:image/svg+xml;base64,${btoa(svg)}`;
    const tokenUri = `data:application/json;base64,${btoa(
      JSON.stringify({ image, name: "Pass" }),
    )}`;
    const decoded = decodeOnchainTokenUri(tokenUri);
    expect(decoded.image.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(atob(decoded.image.split(",")[1] ?? "")).toContain("12A");
  });
});
