import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Abi,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { boardingPassAbi } from "../../app/lib/evm/abi/boardingPass";
import { quoteWei, seatPriceWei } from "../../app/lib/booking/seatPricing";
import { SEAT_IDS } from "../../app/lib/booking/seats";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ANVIL_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const CRAFT_ID = 6669;
const BAG_SAMPLES = [0, 1, 2, 10, 65_535] as const;
const SAMPLE_SEATS = [11, 121, 122, 251, 326] as const;

type Artifact = {
  abi: Abi;
  bytecode: { object: Hex };
};

function loadArtifact(path: string): Artifact {
  const full = join(ROOT, path);
  if (!existsSync(full)) {
    throw new Error(`Missing ${path}. Run pnpm contracts:build first.`);
  }
  return JSON.parse(readFileSync(full, "utf8")) as Artifact;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Could not allocate a port"));
        return;
      }
      const port = address.port;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

describe("TypeScript mirror vs BoardingPass quote", () => {
  let anvil: ChildProcess | undefined;
  let client: ReturnType<typeof createPublicClient>;
  let boardingPass: Address;

  beforeAll(async () => {
    const port = await freePort();
    const rpc = `http://127.0.0.1:${port}`;
    anvil = spawn("anvil", ["--port", String(port), "--silent"], {
      shell: true,
      stdio: "pipe",
    });
    await new Promise((resolve) => setTimeout(resolve, 400));
    client = createPublicClient({
      chain: foundry,
      transport: http(rpc),
    });

    let ready = false;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      try {
        await client.getBlockNumber();
        ready = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    if (!ready) {
      throw new Error("Anvil did not become ready");
    }

    const account = privateKeyToAccount(ANVIL_KEY);
    const wallet = createWalletClient({
      account,
      chain: foundry,
      transport: http(rpc),
    });

    const vesselArt = loadArtifact("contracts/out/MockVessel.sol/MockVessel.json");
    const passArt = loadArtifact(
      "contracts/out/BoardingPass.sol/BoardingPass.json",
    );

    const vesselHash = await wallet.deployContract({
      abi: vesselArt.abi,
      bytecode: vesselArt.bytecode.object,
    });
    const vesselReceipt = await client.waitForTransactionReceipt({
      hash: vesselHash,
    });
    const vessel = vesselReceipt.contractAddress;
    if (!vessel) {
      throw new Error("MockVessel deploy returned no address");
    }

    const claimHash = await wallet.writeContract({
      address: vessel,
      abi: vesselArt.abi,
      functionName: "claimForTest",
      args: [BigInt(CRAFT_ID), account.address, true],
    });
    await client.waitForTransactionReceipt({ hash: claimHash });

    const passHash = await wallet.deployContract({
      abi: passArt.abi,
      bytecode: passArt.bytecode.object,
      args: [vessel, CRAFT_ID, account.address, account.address],
    });
    const passReceipt = await client.waitForTransactionReceipt({
      hash: passHash,
    });
    if (!passReceipt.contractAddress) {
      throw new Error("BoardingPass deploy returned no address");
    }
    boardingPass = passReceipt.contractAddress;
  }, 60_000);

  afterAll(() => {
    anvil?.kill();
  });

  it("matches seatPrice for all 184 seats", async () => {
    for (const seatId of SEAT_IDS) {
      const onchain = await client.readContract({
        address: boardingPass,
        abi: boardingPassAbi,
        functionName: "seatPrice",
        args: [seatId],
      });
      expect(onchain, `seat ${seatId}`).toBe(seatPriceWei(seatId));
    }
  }, 60_000);

  it("matches quote for sample bag counts", async () => {
    for (const seatId of SAMPLE_SEATS) {
      for (const bags of BAG_SAMPLES) {
        const onchain = await client.readContract({
          address: boardingPass,
          abi: boardingPassAbi,
          functionName: "quote",
          args: [seatId, bags],
        });
        expect(onchain, `seat ${seatId} bags ${bags}`).toBe(
          quoteWei(seatId, bags),
        );
      }
    }
  });
});
