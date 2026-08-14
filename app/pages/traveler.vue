<script setup lang="ts">
const {
  state,
  syncTraveler,
  isDraftPending,
  draftError,
  isSavingDraft,
} = useBookingSync();

const statusMessage = computed(() => {
  if (isDraftPending.value && state.value.fullName.length === 0) {
    return "Looking up your saved details…";
  }
  if (draftError.value) {
    return "Using details saved on this device.";
  }
  if (state.value.fullName.length === 0) {
    return "Enter traveler details to continue.";
  }
  return "Your details are saved on this device.";
});

async function onContinue() {
  try {
    await syncTraveler();
  } catch {
    // Local draft remains; guest can still choose a seat.
  }
  await navigateTo("/seats");
}
</script>

<template>
  <div class="airline-funnel">
    <div class="airline-funnel__main">
      <BookingProgress step="traveler" />
      <p
        class="airline-funnel__status"
        role="status"
      >
        {{ statusMessage }}
      </p>
      <TravelerForm
        :pending="isSavingDraft"
        @continue="onContinue"
      />
    </div>
    <TripSummary />
  </div>
</template>
