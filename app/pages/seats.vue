<script setup lang="ts">
import {
  nextSelectedSeatId,
  seatVisualState,
} from "~/lib/booking/seatVisual";

const {
  state,
  selectSeat,
  clearSeat,
  canReview,
  syncSession,
} = useBookingSync();
const { availability, status } = useSeatAvailability();

const continueReady = computed(
  () => state.value.selectedSeatId !== undefined,
);

function onSelectSeat(seatId: number) {
  const visual = seatVisualState({
    status: status.value,
    available: availability.value.get(seatId),
    selected: state.value.selectedSeatId === seatId,
  });
  const next = nextSelectedSeatId(state.value.selectedSeatId, seatId, visual);
  if (next === undefined) {
    clearSeat();
  } else {
    selectSeat(next);
  }
  void syncSession(next === undefined ? "traveler" : "seated");
}

async function onContinue() {
  if (!continueReady.value) {
    return;
  }
  try {
    await syncSession("seated");
  } catch {
    // Local seat choice is already persisted.
  }
  await navigateTo("/review");
}
</script>

<template>
  <div class="airline-funnel airline-funnel--seats">
    <div class="airline-funnel__main">
      <BookingProgress step="seats" />
      <header class="airline-funnel__header">
        <h1>Choose your seat</h1>
        <p>
          Pick a window, aisle, or extra-legroom seat. Occupied seats stay
          locked until you choose another.
        </p>
      </header>
      <p
        class="airline-funnel__status"
        role="status"
      >
        <template v-if="status === 'loading'">
          Checking which seats are open…
        </template>
        <template v-else-if="status === 'error'">
          Live availability is delayed. Occupied seats from our latest update
          stay unavailable.
        </template>
        <template v-else>
          {{ canReview ? "Seat selected. Continue when you are ready." : "Select a seat to continue." }}
        </template>
      </p>
      <SeatLegend />
      <div class="airline-aircraft-scroll">
        <AircraftSeatMap
          :selected-seat-id="state.selectedSeatId"
          :availability="availability"
          :status="status"
          @select="onSelectSeat"
        />
      </div>
      <BaggageSelector v-if="state.selectedSeatId !== undefined" />
      <Button
        class="primary airline-seats__continue"
        type="button"
        :disabled="!continueReady"
        @click="onContinue"
      >
        Continue to review
      </Button>
    </div>
    <TripSummary />
  </div>
</template>
