/**
 * Plan 12: batched `getSeatAvailability` lives in `useBoardingPassContract`.
 * This module keeps the call shape for tests that do not mount Vue.
 */
export type ReadSeatAvailability = (
  seatIds: readonly number[],
) => Promise<readonly boolean[]>;
