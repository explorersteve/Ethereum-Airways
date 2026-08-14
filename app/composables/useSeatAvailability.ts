import { api } from "../../convex/_generated/api";
import {
  applyContractAvailability,
  applyConvexSeatIndex,
} from "~/lib/booking/availability";
import type { AvailabilityStatus } from "~/lib/booking/seatVisual";
import { SEAT_IDS } from "~/lib/booking/seats";

const REFRESH_MS = 45_000;

export function useSeatAvailability() {
  const availability = shallowRef(new Map<number, boolean>());
  const status = ref<AvailabilityStatus>("loading");
  const contractApplied = ref(false);
  const { readAvailability, contractAddress } = useBoardingPassContract();

  const { data: seatIndex } = useConvexQuery(
    api.seats.listSeatIndex,
    {},
    { server: false },
  );

  const { state } = useBooking();

  watch(
    seatIndex,
    (rows) => {
      if (!rows) {
        return;
      }
      availability.value = applyConvexSeatIndex(
        availability.value,
        rows,
        contractApplied.value,
      );
    },
    { immediate: true },
  );

  async function refresh() {
    if (!contractAddress.value) {
      if (!contractApplied.value) {
        status.value = "error";
      }
      return;
    }
    try {
      const chain = await readAvailability(SEAT_IDS);
      let next = applyContractAvailability(
        availability.value,
        SEAT_IDS,
        chain,
      );
      if (seatIndex.value) {
        next = applyConvexSeatIndex(next, seatIndex.value, true);
      }
      availability.value = next;
      contractApplied.value = true;
      status.value = "ready";
    } catch {
      if (!contractApplied.value) {
        status.value = "error";
      }
    }
  }

  if (import.meta.client) {
    onMounted(() => {
      void refresh();
      const timer = window.setInterval(() => {
        void refresh();
      }, REFRESH_MS);
      onBeforeUnmount(() => window.clearInterval(timer));
    });
  }

  watch(
    () => state.value.txHash,
    (hash, previous) => {
      if (hash && hash !== previous) {
        void refresh();
      }
    },
  );

  return {
    availability,
    status,
    refresh,
  };
}
