export type DeploymentRecord = {
  chainId: number;
  boardingPass: string;
  renderer?: string;
  vessel?: string;
  vesselCraftId?: number;
  deploymentBlock: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPositiveInt(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

export function parseDeploymentRecord(value: unknown): DeploymentRecord {
  if (!isRecord(value)) {
    throw new Error("Invalid deployment record");
  }
  const chainId = readPositiveInt(value.chainId, "deployment chainId");
  if (
    typeof value.boardingPass !== "string" ||
    !value.boardingPass.startsWith("0x")
  ) {
    throw new Error("Invalid deployment boardingPass address");
  }
  const deploymentBlock = value.deploymentBlock;
  if (
    typeof deploymentBlock !== "number" ||
    !Number.isInteger(deploymentBlock) ||
    deploymentBlock < 1
  ) {
    throw new Error(
      "deploymentBlock must be the deploy transaction block, never genesis",
    );
  }
  return {
    chainId,
    boardingPass: value.boardingPass,
    renderer: typeof value.renderer === "string" ? value.renderer : undefined,
    vessel: typeof value.vessel === "string" ? value.vessel : undefined,
    vesselCraftId:
      typeof value.vesselCraftId === "number" ? value.vesselCraftId : undefined,
    deploymentBlock,
  };
}

export function startBlockFromDeployment(record: DeploymentRecord): number {
  return record.deploymentBlock;
}
