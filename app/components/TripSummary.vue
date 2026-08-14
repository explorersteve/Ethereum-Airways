<script setup lang="ts">
import { formatEth } from "~/lib/format/eth";

const { state, totalWei } = useBooking();

const open = ref(true);

onMounted(() => {
  const media = window.matchMedia("(max-width: 900px)");
  const sync = () => {
    open.value = !media.matches;
  };
  sync();
  media.addEventListener("change", sync);
  onBeforeUnmount(() => media.removeEventListener("change", sync));
});

const seatLine = computed(() => state.value.selectedSeatLabel ?? "Not selected");
</script>

<template>
  <aside class="airline-summary">
    <details
      class="airline-summary__panel"
      :open="open"
    >
      <summary
        class="airline-summary__toggle"
        @click.prevent="open = !open"
      >
        <span class="airline-label">Total</span>
        <strong>{{ formatEth(totalWei) }} ETH</strong>
      </summary>
      <h2 class="airline-summary__title">Trip summary</h2>
      <dl class="airline-summary__list">
        <div>
          <dt>Round-trip fare</dt>
          <dd>{{ formatEth(state.baseFareWei) }} ETH</dd>
        </div>
        <div>
          <dt>Seat</dt>
          <dd>{{ seatLine }}</dd>
        </div>
        <div>
          <dt>Bags</dt>
          <dd>{{ state.bagCount }}</dd>
        </div>
        <div class="airline-summary__total">
          <dt>Total</dt>
          <dd>{{ formatEth(totalWei) }} ETH</dd>
        </div>
      </dl>
    </details>
  </aside>
</template>
