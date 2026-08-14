<script setup lang="ts">
import type { Seat } from "~/lib/booking/seats";
import { formatEth } from "~/lib/format/eth";
import {
  seatAriaLabel,
  seatIsDisabled,
  seatTooltip,
  type SeatVisualState,
} from "~/lib/booking/seatVisual";

const props = defineProps<{
  seat: Seat;
  state: SeatVisualState;
  priceWei: bigint;
}>();

const emit = defineEmits<{
  select: [seatId: number];
}>();

const priceEth = computed(() => formatEth(props.priceWei));
const aria = computed(() =>
  seatAriaLabel(props.seat, props.state, priceEth.value),
);
const tooltip = computed(() => seatTooltip(props.seat, priceEth.value));
const disabled = computed(() => seatIsDisabled(props.state));
</script>

<template>
  <button
    type="button"
    class="airline-seat"
    :class="`airline-seat--${seat.cabin.toLowerCase()}`"
    :data-state="state"
    :data-seat-id="seat.seatId"
    :data-cabin="seat.cabin"
    :disabled="disabled"
    :aria-label="aria"
    :aria-pressed="state === 'selected'"
    :aria-busy="state === 'loading'"
    @click="emit('select', seat.seatId)"
  >
    <span class="airline-seat__glyph" aria-hidden="true">
      <svg
        v-if="state === 'selected'"
        viewBox="0 0 16 16"
        width="12"
        height="12"
      >
        <path
          d="M3.2 8.4 6.1 11.2 12.8 4.6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span
        v-else-if="state === 'occupied'"
        class="airline-seat__x"
      >×</span>
      <span
        v-else-if="seat.cabin === 'First'"
        class="airline-seat__mark airline-seat__mark--first"
      />
      <span
        v-else-if="seat.cabin === 'Comfort'"
        class="airline-seat__mark airline-seat__mark--comfort"
      />
      <span
        v-else-if="seat.cabin === 'Exit'"
        class="airline-seat__mark airline-seat__mark--exit"
      />
    </span>
    <span class="airline-seat__label">{{ seat.column }}</span>
    <span class="airline-seat__tooltip">{{ tooltip }}</span>
    <span
      v-if="state === 'occupied'"
      class="sr-only"
    >Unavailable</span>
  </button>
</template>
