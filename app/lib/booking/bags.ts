import { MAX_BAGS } from "./flight";

export function clampBagCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const rounded = Math.trunc(value);
  if (rounded < 0) {
    return 0;
  }
  if (rounded > MAX_BAGS) {
    return MAX_BAGS;
  }
  return rounded;
}
