<script setup lang="ts">
import AirlineOnchainArtifact from "~/components/airline/OnchainArtifact.vue";
import { api } from "../../../convex/_generated/api";
import { FLIGHT } from "~/lib/booking/flight";
import { priorityLabel, seatById } from "~/lib/booking/seats";
import { boardingPassExplorerLinks } from "~/lib/evm/explorer";
import { classifyPassReadError, parseTokenIdParam } from "~/lib/evm/passRead";
import { formatTxHash } from "~/lib/format/address";

const route = useRoute();
const { state } = useBooking();
const {
  readTokenUri,
  readBoardingPass,
  contractAddress,
  mainChainId,
  chain,
} = useBoardingPassContract();

const tokenId = computed(() => parseTokenIdParam(String(route.params.tokenId ?? "")));

const pageStatus = ref<"loading" | "ready" | "missing" | "rpc">("loading");
const tokenUri = ref("");
const seatLabelText = ref("");
const seatPriorityText = ref("");
const vesselCraftId = ref<number | undefined>();
const vesselEntry = ref<number | undefined>();
const copied = ref(false);

const mintQueryArgs = computed(() => {
  if (!tokenId.value || !contractAddress.value) {
    return { chainId: 0, contractAddress: "0x0000000000000000000000000000000000000000", tokenId: 0 };
  }
  return {
    chainId: mainChainId,
    contractAddress: contractAddress.value,
    tokenId: tokenId.value,
  };
});

const { data: mintRow } = useConvexQuery(
  api.mints.getMintByTokenId,
  () => mintQueryArgs.value,
  { server: false },
);

const txHash = computed(() => {
  if (mintRow.value?.txHash) {
    return mintRow.value.txHash;
  }
  if (state.value.tokenId === tokenId.value && state.value.txHash) {
    return state.value.txHash;
  }
  return undefined;
});

const explorerLinks = computed(() => {
  if (!chain.value || !tokenId.value) {
    return {};
  }
  return boardingPassExplorerLinks({
    chain: chain.value,
    tokenId: tokenId.value,
    txHash: txHash.value,
    vesselCraftId: vesselCraftId.value,
  });
});

const finalizing = computed(
  () =>
    pageStatus.value === "ready" &&
    (!mintRow.value || mintRow.value.status !== "verified"),
);

async function loadPass() {
  copied.value = false;
  if (!tokenId.value) {
    pageStatus.value = "missing";
    return;
  }
  if (!contractAddress.value) {
    pageStatus.value = "rpc";
    return;
  }
  pageStatus.value = "loading";
  try {
    const [uri, pass] = await Promise.all([
      readTokenUri(tokenId.value),
      readBoardingPass(tokenId.value),
    ]);
    tokenUri.value = uri;
    const seat = seatById(Number(pass.seatId));
    seatLabelText.value = seat?.label ?? String(pass.seatId);
    seatPriorityText.value = seat ? priorityLabel(seat) : "";
    vesselCraftId.value = Number(pass.vesselCraftId);
    vesselEntry.value = Number(pass.vesselEntry);
    pageStatus.value = "ready";
  } catch (error) {
    pageStatus.value = classifyPassReadError(error);
  }
}

async function copyLink() {
  if (!tokenId.value) {
    return;
  }
  const url = `${window.location.origin}/boarding-pass/${tokenId.value}`;
  try {
    await navigator.clipboard.writeText(url);
    copied.value = true;
  } catch {
    copied.value = false;
  }
}

onMounted(() => {
  void loadPass();
});

watch(tokenId, (next, previous) => {
  if (next === previous) {
    return;
  }
  void loadPass();
});
</script>

<template>
  <div class="airline-pass">
    <BookingProgress step="boarding-pass" />

    <header class="airline-funnel__header">
      <h1>Welcome aboard.</h1>
      <p>{{ FLIGHT.origin }} → {{ FLIGHT.destination }}</p>
    </header>

    <p
      v-if="pageStatus === 'loading'"
      class="airline-funnel__status"
      role="status"
    >
      Loading your boarding pass from the chain…
    </p>

    <section
      v-else-if="pageStatus === 'missing'"
      class="airline-pass__notice"
    >
      <h2>Boarding pass not found</h2>
      <p>
        This token has not been minted. Check the pass number, or return to
        book a seat.
      </p>
      <Button
        class="primary"
        type="button"
        @click="navigateTo('/')"
      >
        Book a flight
      </Button>
    </section>

    <section
      v-else-if="pageStatus === 'rpc'"
      class="airline-pass__notice"
    >
      <h2>We couldn’t reach the network</h2>
      <p>The boarding pass lives onchain. Try loading it again.</p>
      <Button
        class="primary"
        type="button"
        @click="loadPass"
      >
        Retry
      </Button>
    </section>

    <template v-else>
      <p
        v-if="finalizing"
        class="airline-funnel__status"
        role="status"
      >
        Finalizing your record.
      </p>

      <AirlineOnchainArtifact
        v-if="tokenUri"
        :token-uri="tokenUri"
      />

      <dl class="airline-pass__meta">
        <div>
          <dt>Trip</dt>
          <dd>{{ FLIGHT.origin }} → {{ FLIGHT.destination }}</dd>
        </div>
        <div>
          <dt>Seat</dt>
          <dd>{{ seatLabelText }}</dd>
        </div>
        <div v-if="seatPriorityText">
          <dt>Cabin</dt>
          <dd>{{ seatPriorityText }}</dd>
        </div>
        <div v-if="vesselCraftId !== undefined">
          <dt>Vessel</dt>
          <dd>Craft #{{ vesselCraftId }} / Entry #{{ vesselEntry }}</dd>
        </div>
        <div v-if="txHash">
          <dt>Transaction</dt>
          <dd>{{ formatTxHash(txHash) }}</dd>
        </div>
      </dl>

      <div class="airline-pass__actions">
        <a
          v-if="explorerLinks.transaction"
          class="button"
          :href="explorerLinks.transaction"
          target="_blank"
          rel="noreferrer"
        >
          View Transaction
        </a>
        <a
          v-if="explorerLinks.nft"
          class="button"
          :href="explorerLinks.nft"
          target="_blank"
          rel="noreferrer"
        >
          View NFT
        </a>
        <a
          v-if="explorerLinks.vessel"
          class="button"
          :href="explorerLinks.vessel"
          target="_blank"
          rel="noreferrer"
        >
          View Vessel
        </a>
        <Button
          type="button"
          @click="copyLink"
        >
          {{ copied ? "Link copied" : "Copy Boarding Pass Link" }}
        </Button>
      </div>
    </template>
  </div>
</template>
