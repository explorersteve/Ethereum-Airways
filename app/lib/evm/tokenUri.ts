export type OnchainTokenMetadata = {
  name?: string;
  description?: string;
  image: string;
};

const JSON_DATA_PREFIX = "data:application/json;base64,";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function decodeOnchainTokenUri(tokenUri: string): OnchainTokenMetadata {
  if (!tokenUri.startsWith(JSON_DATA_PREFIX)) {
    throw new Error("tokenURI is not an onchain JSON data URI");
  }
  const encoded = tokenUri.slice(JSON_DATA_PREFIX.length);
  let json: unknown;
  try {
    json = JSON.parse(atob(encoded));
  } catch {
    throw new Error("tokenURI JSON could not be decoded");
  }
  if (!isRecord(json) || typeof json.image !== "string" || json.image.length === 0) {
    throw new Error("tokenURI JSON is missing an image");
  }
  return {
    name: typeof json.name === "string" ? json.name : undefined,
    description:
      typeof json.description === "string" ? json.description : undefined,
    image: json.image,
  };
}
