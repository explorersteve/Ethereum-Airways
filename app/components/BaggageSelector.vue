<script setup lang="ts">
import { clampBagCount } from "~/lib/booking/bags";
import { BAG_PRICE_WEI, MAX_BAGS } from "~/lib/booking/flight";
import { formatEth } from "~/lib/format/eth";

const { state, setBags } = useBooking();

const priceCopy = `${formatEth(BAG_PRICE_WEI)} ETH per bag`;

function adjust(delta: number) {
  setBags(clampBagCount(state.value.bagCount + delta));
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowUp" || event.key === "ArrowRight") {
    event.preventDefault();
    adjust(1);
  }
  if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
    event.preventDefault();
    adjust(-1);
  }
}
</script>

<template>
  <div
    class="airline-bags"
    role="group"
    aria-labelledby="bags-heading"
  >
    <h2 id="bags-heading">
      Checked bags
    </h2>
    <p>{{ priceCopy }}</p>
    <div class="airline-bags__control">
      <Button
        type="button"
        :disabled="state.bagCount <= 0"
        aria-label="Remove a checked bag"
        @click="adjust(-1)"
      >
        −
      </Button>
      <span
        class="airline-bags__count"
        tabindex="0"
        role="spinbutton"
        :aria-valuenow="state.bagCount"
        aria-valuemin="0"
        :aria-valuemax="MAX_BAGS"
        aria-label="Checked bags"
        @keydown="onKeydown"
      >{{ state.bagCount }}</span>
      <Button
        type="button"
        :disabled="state.bagCount >= MAX_BAGS"
        aria-label="Add a checked bag"
        @click="adjust(1)"
      >
        +
      </Button>
    </div>
  </div>
</template>
