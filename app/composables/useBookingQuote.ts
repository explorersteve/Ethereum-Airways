import { decodeBookingError } from "~/lib/evm/errors";

export type QuoteStatus = "idle" | "loading" | "ready" | "error" | "claimed";

export function useBookingQuote() {
  const { state, setQuote } = useBooking();
  const { readQuote, readSeatAvailable, contractAddress } =
    useBoardingPassContract();
  const status = ref<QuoteStatus>("idle");
  const message = ref("");

  const quoteWei = computed(() => state.value.authoritativeQuoteWei);

  async function refresh() {
    const seatId = state.value.selectedSeatId;
    if (seatId === undefined) {
      status.value = "idle";
      message.value = "";
      return;
    }
    if (!contractAddress.value) {
      status.value = "error";
      message.value = "Booking is temporarily unavailable.";
      return;
    }
    status.value = "loading";
    message.value = "";
    try {
      const available = await readSeatAvailable(seatId);
      if (!available) {
        status.value = "claimed";
        message.value =
          "This seat was just claimed. Please choose another seat.";
        return;
      }
      const quote = await readQuote(seatId, state.value.bagCount);
      setQuote(quote);
      status.value = "ready";
    } catch (error) {
      const decoded = decodeBookingError(error);
      if (decoded.name === "SeatAlreadyClaimed" || decoded.name === "InvalidSeat") {
        status.value = "claimed";
        message.value = decoded.message;
        return;
      }
      status.value = "error";
      message.value = decoded.message;
    }
  }

  if (import.meta.client) {
    watch(
      () =>
        [
          state.value.selectedSeatId,
          state.value.bagCount,
          contractAddress.value,
        ] as const,
      () => {
        void refresh();
      },
      { immediate: true },
    );
  }

  return {
    quoteWei,
    status,
    message,
    refresh,
  };
}
