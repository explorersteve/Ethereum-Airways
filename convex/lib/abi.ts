export const boardingPassAbi = [
  {
    type: "event",
    name: "BoardingPassMinted",
    inputs: [
      { name: "traveler", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seatId", type: "uint16", indexed: true },
      { name: "totalPaid", type: "uint256", indexed: false },
      { name: "bagCount", type: "uint16", indexed: false },
      { name: "vesselCraftId", type: "uint256", indexed: false },
      { name: "vesselEntry", type: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "getBoardingPass",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "traveler", type: "address" },
          { name: "dateOfBirth", type: "uint32" },
          { name: "seatId", type: "uint16" },
          { name: "bagCount", type: "uint16" },
          { name: "mintedAt", type: "uint64" },
          { name: "totalPaid", type: "uint96" },
          { name: "vesselCraftId", type: "uint16" },
          { name: "vesselEntry", type: "uint32" },
          { name: "fullName", type: "string" },
          { name: "twitterHandle", type: "string" },
        ],
      },
    ],
  },
] as const;
