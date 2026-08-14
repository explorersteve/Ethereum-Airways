import type { BookingState } from "../booking/state";

export type BookAndMintArgs = {
  seatId: number;
  fullName: string;
  dateOfBirth: number;
  twitterHandle: string;
  bagCount: number;
};

export function bookAndMintArgsFromState(state: BookingState): BookAndMintArgs {
  if (state.selectedSeatId === undefined) {
    throw new Error("Choose a seat before booking.");
  }
  if (state.dateOfBirthUint32 === undefined) {
    throw new Error("Please check your date of birth.");
  }
  if (state.fullName.trim().length === 0) {
    throw new Error("Please check your traveler name.");
  }
  return {
    seatId: state.selectedSeatId,
    fullName: state.fullName,
    dateOfBirth: state.dateOfBirthUint32,
    twitterHandle: state.twitterHandle,
    bagCount: state.bagCount,
  };
}
