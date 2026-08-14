import {
  createSessionId,
  loadBookingState,
  saveBookingState,
} from "~/lib/booking/persist";
import { seatById } from "~/lib/booking/seats";
import {
  applyClearSeat,
  applyReset,
  applySelectFlight,
  applySelectSeat,
  applySetBags,
  applySetQuote,
  applySetResult,
  applySetTraveler,
  createBookingState,
  derivedBagsTotalWei,
  derivedSeatPriceWei,
  derivedTotalWei,
  reviewIsReady,
  travelerIsComplete,
  type BookingResult,
  type BookingState,
  type TravelerInput,
} from "~/lib/booking/state";

function persist(state: BookingState) {
  if (!import.meta.client) {
    return;
  }
  saveBookingState(window.localStorage, state);
}

export function useBooking() {
  const state = useState<BookingState>("booking", () =>
    createBookingState(createSessionId()),
  );
  const hydrated = useState("booking-hydrated", () => false);

  if (import.meta.client && !hydrated.value) {
    const restored = loadBookingState(window.localStorage);
    if (restored) {
      Object.assign(state.value, restored);
    } else {
      persist(state.value);
    }
    hydrated.value = true;
  }

  function selectFlight() {
    applySelectFlight(state.value);
    persist(state.value);
  }

  function setTraveler(input: TravelerInput) {
    applySetTraveler(state.value, input);
    persist(state.value);
  }

  function selectSeat(seatId: number) {
    applySelectSeat(state.value, seatId);
    persist(state.value);
  }

  function clearSeat() {
    applyClearSeat(state.value);
    persist(state.value);
  }

  function setBags(bagCount: number) {
    applySetBags(state.value, bagCount);
    persist(state.value);
  }

  function setQuote(quote: bigint) {
    applySetQuote(state.value, quote);
    persist(state.value);
  }

  function setResult(result: BookingResult) {
    applySetResult(state.value, result);
    persist(state.value);
  }

  function reset() {
    applyReset(state.value);
    persist(state.value);
  }

  const seat = computed(() =>
    state.value.selectedSeatId !== undefined
      ? seatById(state.value.selectedSeatId)
      : undefined,
  );
  const seatPriceWei = computed(() => derivedSeatPriceWei(state.value));
  const bagsTotalWei = computed(() => derivedBagsTotalWei(state.value));
  const totalWei = computed(() => derivedTotalWei(state.value));
  const isTravelerComplete = computed(() => travelerIsComplete(state.value));
  const canReview = computed(() => reviewIsReady(state.value));

  return {
    state,
    selectFlight,
    setTraveler,
    selectSeat,
    clearSeat,
    setBags,
    setQuote,
    setResult,
    reset,
    seat,
    seatPriceWei,
    bagsTotalWei,
    totalWei,
    isTravelerComplete,
    canReview,
  };
}
