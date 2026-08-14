<script setup lang="ts">
import type { TransactionReceipt } from "viem";
import { api } from "../../convex/_generated/api";
import { bookAndMintArgsFromState } from "~/lib/evm/bookingArgs";
import { decodeBookingError } from "~/lib/evm/errors";
import { finalizeMint } from "~/lib/evm/finalizeMint";
import { BOOKING_TX_COPY, bookingLiveMessage } from "~/lib/evm/txCopy";
import { formatEth } from "~/lib/format/eth";
import { priorityLabel } from "~/lib/booking/seats";
import { BAG_PRICE_WEI } from "~/lib/booking/flight";

const claimedNotice = useState("seat-claimed-notice", () => "");

const {
  state,
  seat,
  seatPriceWei,
  bagsTotalWei,
  totalWei,
  canReview,
  isTravelerComplete,
  setResult,
  setQuote,
  clearSeat,
} = useBooking();
const { status: quoteStatus, message: quoteMessage, refresh } =
  useBookingQuote();
const {
  isConnected,
  isCorrectChain,
  submitBooking,
  mainChainId,
  contractAddress,
} = useBoardingPassContract();
const { mutate: recordMint } = useConvexMutation(api.mints.recordMint);

const consent = ref(false);
const liveError = ref("");
const purchasing = ref(false);
const finalizingNote = ref("");

const seatPriority = computed(() =>
  seat.value ? priorityLabel(seat.value) : undefined,
);

const extrasLabel = computed(() => {
  const count = state.value.bagCount;
  if (count === 0) {
    return "None";
  }
  if (count === 1) {
    return "1 Checked Bag";
  }
  return `${count} Checked Bags`;
});

const ctaLabel = computed(
  () => `Purchase Boarding Pass · ${formatEth(totalWei.value)} ETH`,
);

const canPurchase = computed(
  () =>
    Boolean(canReview.value) &&
    isConnected.value &&
    isCorrectChain.value &&
    consent.value &&
    quoteStatus.value !== "claimed" &&
    !purchasing.value,
);

const txText = {
  title: {
    confirm: "Confirm your booking",
    requesting: "Confirm your booking",
    waiting: BOOKING_TX_COPY.inFlight,
    complete: BOOKING_TX_COPY.cleared,
    error: "Booking paused",
  },
  lead: {
    confirm: BOOKING_TX_COPY.confirmWallet,
    requesting: BOOKING_TX_COPY.confirmWallet,
    waiting: BOOKING_TX_COPY.inFlight,
    complete: BOOKING_TX_COPY.cleared,
  },
  action: {
    confirm: "Purchase Boarding Pass",
    error: "Try again",
  },
};

const quoteLiveStatus = computed(() => {
  if (liveError.value) {
    return liveError.value;
  }
  if (finalizingNote.value) {
    return finalizingNote.value;
  }
  if (quoteStatus.value === "claimed" || claimedNotice.value) {
    return (
      quoteMessage.value ||
      claimedNotice.value ||
      "This seat was just claimed. Please choose another seat."
    );
  }
  if (quoteStatus.value === "loading") {
    return "Checking that this seat is still open…";
  }
  if (quoteStatus.value === "error") {
    return quoteMessage.value;
  }
  return "";
});

watch(quoteStatus, async (next) => {
  if (next !== "claimed") {
    return;
  }
  claimedNotice.value =
    quoteMessage.value ||
    "This seat was just claimed. Please choose another seat.";
  clearSeat();
  await navigateTo("/seats");
});

onMounted(async () => {
  if (!isTravelerComplete.value) {
    await navigateTo("/traveler");
    return;
  }
  if (state.value.selectedSeatId === undefined) {
    await navigateTo("/seats");
  }
});

async function requestBooking() {
  liveError.value = "";
  purchasing.value = true;
  try {
    const args = bookAndMintArgsFromState(state.value);
    const hash = await submitBooking(args);
    return hash;
  } catch (error) {
    const decoded = decodeBookingError(error);
    liveError.value = decoded.message;
    if (decoded.name === "SeatAlreadyClaimed" || decoded.name === "InvalidSeat") {
      claimedNotice.value = decoded.message;
      clearSeat();
      await navigateTo("/seats");
    }
    if (decoded.name === "IncorrectPayment") {
      await refresh();
    }
    throw new Error(decoded.message, { cause: error });
  } finally {
    purchasing.value = false;
  }
}

async function onComplete(receipt: TransactionReceipt) {
  liveError.value = "";
  finalizingNote.value = "";
  setQuote(totalWei.value);
  const address = contractAddress.value;
  if (!address) {
    setResult({
      txHash: receipt.transactionHash,
      walletAddress: receipt.from,
    });
    finalizingNote.value = "Finalizing your record.";
    return;
  }
  const result = await finalizeMint({
    receipt,
    contractAddress: address,
    chainId: mainChainId,
    recordMint,
  });
  if (!result.minted) {
    setResult({
      txHash: receipt.transactionHash,
      walletAddress: receipt.from,
    });
    finalizingNote.value =
      "Your booking is confirmed onchain. Finalizing your record.";
    return;
  }
  setResult({
    txHash: receipt.transactionHash,
    walletAddress: receipt.from,
    tokenId: result.minted.tokenId,
    vesselCraftId: result.minted.vesselCraftId,
    vesselEntry: result.minted.vesselEntry,
  });
  if (!result.recorded) {
    finalizingNote.value = "Finalizing your record.";
  }
  await navigateTo(`/boarding-pass/${result.minted.tokenId}`);
}
</script>

<template>
  <div class="airline-funnel">
    <div class="airline-funnel__main">
      <BookingProgress step="review" />
      <header class="airline-funnel__header">
        <h1>Review your trip</h1>
        <p>Confirm the details below, then purchase your boarding pass.</p>
      </header>

      <p
        class="airline-funnel__status"
        role="status"
        aria-live="polite"
      >
        {{ quoteLiveStatus }}
      </p>

      <section class="airline-review">
        <article>
          <h2>Flight</h2>
          <dl>
            <div>
              <dt>Route</dt>
              <dd>{{ state.origin }} → {{ state.destination }}</dd>
            </div>
            <div>
              <dt>Trip</dt>
              <dd>{{ state.tripType }}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>{{ state.departure }}</dd>
            </div>
            <div>
              <dt>Flight</dt>
              <dd>{{ state.flightNumber }}</dd>
            </div>
          </dl>
        </article>

        <article>
          <h2>Traveler</h2>
          <dl>
            <div>
              <dt>Full name</dt>
              <dd>{{ state.fullName }}</dd>
            </div>
            <div>
              <dt>Date of birth</dt>
              <dd>{{ state.dateOfBirthISO }}</dd>
            </div>
            <div>
              <dt>Handle</dt>
              <dd>{{ state.twitterHandle ? `@${state.twitterHandle}` : "—" }}</dd>
            </div>
          </dl>
        </article>

        <article>
          <h2>Seat</h2>
          <dl>
            <div>
              <dt>Seat</dt>
              <dd>{{ state.selectedSeatLabel ?? "Not selected" }}</dd>
            </div>
            <div v-if="seatPriority">
              <dt>Cabin</dt>
              <dd>{{ seatPriority }}</dd>
            </div>
          </dl>
        </article>

        <article>
          <h2>Extras</h2>
          <p>{{ extrasLabel }}</p>
        </article>

        <article>
          <h2>Payment</h2>
          <dl>
            <div>
              <dt>Round-trip fare</dt>
              <dd>{{ formatEth(state.baseFareWei) }} ETH</dd>
            </div>
            <div>
              <dt>Seat</dt>
              <dd>{{ formatEth(seatPriceWei) }} ETH</dd>
            </div>
            <div>
              <dt>Bags</dt>
              <dd>
                {{ formatEth(bagsTotalWei) }} ETH
                <template v-if="state.bagCount > 0">
                  ({{ formatEth(BAG_PRICE_WEI) }} ETH each)
                </template>
              </dd>
            </div>
            <div class="airline-review__total">
              <dt>Total</dt>
              <dd>{{ formatEth(totalWei) }} ETH</dd>
            </div>
          </dl>
        </article>
      </section>

      <label class="airline-consent">
        <input
          v-model="consent"
          type="checkbox"
        >
        <!-- Product disclosure, not an onchain permission. Direct contract callers bypass it. -->
        <span>
          I understand that my passenger information, including my
          name and date of birth, will be permanently stored on a
          public blockchain and may not be removable.
        </span>
      </label>

      <div
        v-if="!isConnected"
        class="airline-review__wallet"
      >
        <EvmConnectDialog class-name="primary">
          Connect Wallet to Book
        </EvmConnectDialog>
      </div>

      <div
        v-else-if="!isCorrectChain"
        class="airline-review__wallet"
      >
        <p>Switch to the Ethereum Airways network to complete your booking.</p>
        <EvmSwitchNetwork class-name="primary" />
        <Button
          class="primary"
          type="button"
          disabled
        >
          {{ ctaLabel }}
        </Button>
      </div>

      <EvmTransactionFlowDialog
        v-else
        :chain="mainChainId"
        :text="txText"
        :request="requestBooking"
        keep-open
        :auto-close-success="false"
        @complete="onComplete"
      >
        <template #start="{ start, step }">
          <p
            class="airline-funnel__status"
            role="status"
            aria-live="polite"
          >
            {{ liveError || finalizingNote || bookingLiveMessage(step) }}
          </p>
          <Button
            class="primary"
            type="button"
            :disabled="!canPurchase || (step !== 'idle' && step !== 'complete')"
            @click="start"
          >
            {{ purchasing || step === "waiting" || step === "requesting" ? BOOKING_TX_COPY.inFlight : ctaLabel }}
          </Button>
        </template>
      </EvmTransactionFlowDialog>
    </div>
    <TripSummary />
  </div>
</template>
