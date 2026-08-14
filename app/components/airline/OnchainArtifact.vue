<script setup lang="ts">
import { decodeOnchainTokenUri } from "~/lib/evm/tokenUri";

const props = defineProps<{
  tokenUri: string;
}>();

const decoded = computed(() => {
  try {
    return decodeOnchainTokenUri(props.tokenUri);
  } catch {
    return null;
  }
});
</script>

<template>
  <figure
    v-if="decoded"
    class="onchain-artifact"
  >
    <img
      :src="decoded.image"
      :alt="decoded.name ?? 'Onchain boarding pass'"
    >
  </figure>
  <p
    v-else
    class="airline-funnel__status"
    role="status"
  >
    The onchain image could not be decoded.
  </p>
</template>
