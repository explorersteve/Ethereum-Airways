<script setup lang="ts">
import { FLIGHT } from "~/lib/booking/flight";
import { formatEth } from "~/lib/format/eth";

defineProps<{
  pending?: boolean;
}>();

const emit = defineEmits<{
  select: [];
}>();
</script>

<template>
  <Card class="airline-flight-card">
    <div class="airline-flight-card__route">
      <p class="airline-label">{{ FLIGHT.flightNumber }}</p>
      <div class="airline-flight-card__cities">
        <div>
          <strong>{{ FLIGHT.origin }}</strong>
          <span>{{ FLIGHT.departure }}</span>
        </div>
        <span
          class="airline-flight-card__arrow"
          aria-hidden="true"
        >→</span>
        <div>
          <strong>{{ FLIGHT.destination }}</strong>
          <span>{{ FLIGHT.departure }}</span>
        </div>
      </div>
      <p class="airline-flight-card__meta">Nonstop · {{ FLIGHT.tripType }}</p>
    </div>
    <div class="airline-flight-card__fare">
      <p class="airline-label">Main Cabin</p>
      <p class="airline-flight-card__price">
        {{ formatEth(FLIGHT.baseFareWei) }} ETH
      </p>
      <Button
        class="primary"
        :disabled="pending"
        @click="emit('select')"
      >
        {{ pending ? "Saving…" : "Select" }}
      </Button>
    </div>
  </Card>
</template>
