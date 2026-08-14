<script setup lang="ts">
import { api } from "../../convex/_generated/api";

const { walletAddress, isConnected } = useBoardingPassContract();

const { data: trips, isPending } = useConvexQuery(
  api.mints.listMintsByOwner,
  () => ({
    travelerAddress:
      walletAddress.value ?? "0x0000000000000000000000000000000000000000",
  }),
  { server: false },
);

const mine = computed(() => (walletAddress.value ? trips.value ?? [] : []));
</script>

<template>
  <div class="airline-funnel">
    <div class="airline-funnel__main">
      <header class="airline-funnel__header">
        <h1>My trips</h1>
        <p>Boarding passes for the connected wallet.</p>
      </header>

      <div
        v-if="!isConnected"
        class="airline-review__wallet"
      >
        <EvmConnectDialog class-name="primary">
          Connect Wallet
        </EvmConnectDialog>
      </div>

      <p
        v-else-if="isPending"
        class="airline-funnel__status"
        role="status"
      >
        Looking up your trips…
      </p>

      <p
        v-else-if="mine.length === 0"
        class="airline-funnel__status"
      >
        No boarding passes indexed for this wallet yet.
      </p>

      <ul
        v-else
        class="airline-trips"
      >
        <li
          v-for="trip in mine"
          :key="`${trip.chainId}-${trip.tokenId}`"
        >
          <NuxtLink :to="`/boarding-pass/${trip.tokenId}`">
            <strong>Seat {{ trip.seatLabel ?? trip.tokenId }}</strong>
            <span>
              Current Location → Ethereum
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>
