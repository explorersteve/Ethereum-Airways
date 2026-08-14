<script setup lang="ts">
const { selectFlight, syncSession, isSessionPending } = useBookingSync();

async function onSelect() {
  selectFlight();
  try {
    await syncSession("open");
  } catch {
    // Local booking state is already saved; continue the funnel.
  }
  await navigateTo("/traveler");
}
</script>

<template>
  <div class="airline-funnel">
    <div class="airline-funnel__main">
      <BookingProgress step="flights" />
      <header class="airline-funnel__header">
        <h1>Choose your flight</h1>
        <p>One nonstop round trip from Current Location to Ethereum.</p>
      </header>
      <FlightResultCard
        :pending="isSessionPending"
        @select="onSelect"
      />
    </div>
    <TripSummary />
  </div>
</template>
