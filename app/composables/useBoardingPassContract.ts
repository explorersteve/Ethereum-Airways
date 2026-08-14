import {
  getAccount,
  readContract,
  simulateContract,
  writeContract,
} from "@wagmi/core";
import type { Address, Hash } from "viem";
import { quoteWei } from "~/lib/booking/seatPricing";
import { boardingPassAbi } from "~/lib/evm/abi/boardingPass";
import type { BookAndMintArgs } from "~/lib/evm/bookingArgs";
import { decodeBookingError } from "~/lib/evm/errors";

export type BookingWriteArgs = BookAndMintArgs;

function asUint16(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0 || value > 65_535) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

export function useBoardingPassContract() {
  const wagmiConfig = useConfig();
  const { address: walletAddress, chainId: walletChainId, status } =
    useConnection();
  const mainChainId = useMainChainId();
  const { byId } = useAirlineChains();

  const chain = computed(() => byId(mainChainId));
  const contractAddress = computed(
    () => chain.value?.boardingPassAddress || undefined,
  );
  const isConnected = computed(() => status.value === "connected");
  const isCorrectChain = computed(
    () =>
      isConnected.value &&
      walletChainId.value !== undefined &&
      walletChainId.value === mainChainId,
  );

  function requireAddress(): Address {
    const address = contractAddress.value;
    if (!address) {
      throw new Error("Booking is temporarily unavailable.");
    }
    return address;
  }

  function contractRead(chainId = mainChainId) {
    return {
      address: requireAddress(),
      abi: boardingPassAbi,
      chainId,
    } as const;
  }

  async function readQuote(seatId: number, bagCount: number): Promise<bigint> {
    return readContract(wagmiConfig, {
      ...contractRead(),
      functionName: "quote",
      args: [asUint16(seatId, "seat"), asUint16(bagCount, "bag count")],
    });
  }

  async function readSeatPrice(seatId: number): Promise<bigint> {
    return readContract(wagmiConfig, {
      ...contractRead(),
      functionName: "seatPrice",
      args: [asUint16(seatId, "seat")],
    });
  }

  async function readAvailability(
    seatIds: readonly number[],
  ): Promise<readonly boolean[]> {
    return readContract(wagmiConfig, {
      ...contractRead(),
      functionName: "getSeatAvailability",
      args: [seatIds.map((id) => asUint16(id, "seat"))],
    });
  }

  async function readSeatAvailable(seatId: number): Promise<boolean> {
    return readContract(wagmiConfig, {
      ...contractRead(),
      functionName: "isSeatAvailable",
      args: [asUint16(seatId, "seat")],
    });
  }

  async function readBoardingPass(tokenId: number) {
    return readContract(wagmiConfig, {
      ...contractRead(),
      functionName: "getBoardingPass",
      args: [BigInt(tokenId)],
    });
  }

  async function readTokenUri(tokenId: number): Promise<string> {
    return readContract(wagmiConfig, {
      ...contractRead(),
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    });
  }

  async function simulateBooking(args: BookingWriteArgs, value: bigint) {
    const account = getAccount(wagmiConfig);
    if (!account.address) {
      throw new Error("Connect a wallet to book.");
    }
    return simulateContract(wagmiConfig, {
      ...contractRead(),
      account: account.address,
      functionName: "bookAndMint",
      args: [
        asUint16(args.seatId, "seat"),
        args.fullName,
        args.dateOfBirth,
        args.twitterHandle,
        asUint16(args.bagCount, "bag count"),
      ],
      value,
    });
  }

  async function submitBooking(args: BookingWriteArgs): Promise<Hash> {
    if (status.value !== "connected") {
      throw new Error("Connect a wallet to book.");
    }
    if (walletChainId.value !== mainChainId) {
      throw new Error("Switch to the Ethereum Airways network to book.");
    }
    const value = quoteWei(args.seatId, args.bagCount);
    const { request } = await simulateBooking(args, value);
    return writeContract(wagmiConfig, request);
  }

  return {
    chain,
    contractAddress,
    mainChainId,
    walletAddress,
    isConnected,
    isCorrectChain,
    decodeBookingError,
    readQuote,
    readSeatPrice,
    readAvailability,
    readSeatAvailable,
    readBoardingPass,
    readTokenUri,
    simulateBooking,
    submitBooking,
  };
}
