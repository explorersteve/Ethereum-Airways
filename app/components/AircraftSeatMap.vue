<script setup lang="ts">
import { CABIN_SECTIONS } from "~/lib/booking/seatMapLayout";
import { SEAT_PRICES_WEI } from "~/lib/booking/seatPricing";
import {
  neighborSeatId,
  seatVisualState,
  type AvailabilityStatus,
  type SeatVisualState,
} from "~/lib/booking/seatVisual";
import type { Seat } from "~/lib/booking/seats";

const props = defineProps<{
  selectedSeatId?: number;
  availability: Map<number, boolean>;
  status: AvailabilityStatus;
}>();

const emit = defineEmits<{
  select: [seatId: number];
}>();

const root = ref<HTMLElement | null>(null);

function visualFor(seat: Seat): SeatVisualState {
  return seatVisualState({
    status: props.status,
    available: props.availability.get(seat.seatId),
    selected: props.selectedSeatId === seat.seatId,
  });
}

function priceFor(seat: Seat): bigint {
  return SEAT_PRICES_WEI.get(seat.seatId) ?? 0n;
}

function onMapKeydown(event: KeyboardEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement) || target.dataset.seatId === undefined) {
    return;
  }
  const seatId = Number(target.dataset.seatId);
  if (!Number.isInteger(seatId)) {
    return;
  }
  const direction =
    event.key === "ArrowLeft"
      ? "left"
      : event.key === "ArrowRight"
        ? "right"
        : event.key === "ArrowUp"
          ? "up"
          : event.key === "ArrowDown"
            ? "down"
            : undefined;
  if (!direction) {
    return;
  }
  const next = neighborSeatId(seatId, direction);
  if (next === undefined) {
    return;
  }
  event.preventDefault();
  const node = root.value?.querySelector<HTMLElement>(
    `[data-seat-id="${next}"]`,
  );
  node?.focus();
}
</script>

<template>
  <div
    ref="root"
    class="airline-aircraft"
    role="group"
    aria-label="Aircraft seat map"
    @keydown="onMapKeydown"
  >
    <svg
      v-once
      class="airline-aircraft__fuselage"
      viewBox="0 0 400 1480"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id="fuselage-fill"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop
            offset="0%"
            stop-color="#d9dee8"
          />
          <stop
            offset="50%"
            stop-color="#f4f6fa"
          />
          <stop
            offset="100%"
            stop-color="#d9dee8"
          />
        </linearGradient>
      </defs>
      <path
        class="airline-aircraft__body"
        d="M200 18 C 148 18 118 72 112 140 L 104 1280 C 104 1368 148 1454 200 1462 C 252 1454 296 1368 296 1280 L 288 140 C 282 72 252 18 200 18 Z"
        fill="url(#fuselage-fill)"
        stroke="#0b1b33"
        stroke-width="3"
      />
      <path
        d="M200 18 C 168 18 146 52 140 92 L 260 92 C 254 52 232 18 200 18 Z"
        fill="#0b1b33"
        opacity="0.12"
      />
      <rect
        x="196"
        y="168"
        width="8"
        height="1080"
        rx="4"
        fill="#2563ff"
        opacity="0.18"
      />
      <g
        fill="none"
        stroke="#0b1b33"
        stroke-width="1.2"
        opacity="0.28"
      >
        <rect
          x="132"
          y="150"
          width="136"
          height="28"
          rx="6"
        />
        <rect
          x="132"
          y="1238"
          width="136"
          height="28"
          rx="6"
        />
      </g>
      <g
        fill="#0b1b33"
        font-size="11"
        font-family="Inter, sans-serif"
        letter-spacing="0.12em"
        text-anchor="middle"
        opacity="0.55"
      >
        <text
          x="200"
          y="169"
        >GALLEY</text>
        <text
          x="200"
          y="1257"
        >GALLEY</text>
      </g>
      <g
        transform="translate(148 1284)"
        fill="none"
        stroke="#0b1b33"
        stroke-width="1.4"
        opacity="0.5"
      >
        <rect
          width="18"
          height="22"
          rx="3"
        />
        <circle
          cx="9"
          cy="8"
          r="2.2"
        />
        <path d="M4 18 Q9 13 14 18" />
      </g>
      <g
        transform="translate(234 1284)"
        fill="none"
        stroke="#0b1b33"
        stroke-width="1.4"
        opacity="0.5"
      >
        <rect
          width="18"
          height="22"
          rx="3"
        />
        <circle
          cx="9"
          cy="8"
          r="2.2"
        />
        <path d="M4 18 Q9 13 14 18" />
      </g>
      <path
        d="M104 1328 L 72 1460 L 328 1460 L 296 1328"
        fill="#0b1b33"
        opacity="0.08"
      />
      <path
        d="M200 1388 L 168 1468 L 232 1468 Z"
        fill="#0b1b33"
        opacity="0.2"
      />
    </svg>

    <div class="airline-aircraft__cabin">
      <p class="airline-aircraft__cue airline-label">
        Front galley
      </p>

      <section
        v-for="section in CABIN_SECTIONS"
        :key="section.cabin"
        class="airline-cabin-section"
        :data-cabin="section.cabin"
      >
        <div
          v-if="section.cabin === 'Exit'"
          class="airline-aircraft__wings"
          aria-hidden="true"
        >
          <svg
            v-once
            viewBox="0 0 640 120"
            class="airline-aircraft__wings-svg"
          >
            <path
              d="M0 58 L 220 28 L 248 92 L 18 108 Z"
              fill="#c5d0de"
              stroke="#0b1b33"
              stroke-width="2"
            />
            <path
              d="M640 58 L 420 28 L 392 92 L 622 108 Z"
              fill="#c5d0de"
              stroke="#0b1b33"
              stroke-width="2"
            />
          </svg>
        </div>
        <h2>{{ section.heading }}</h2>
        <div
          v-for="row in section.rows"
          :key="row.row"
          class="airline-seat-row"
        >
          <span class="airline-seat-row__number">{{ row.row }}</span>
          <template
            v-for="(cell, index) in row.cells"
            :key="cell.kind === 'seat' ? cell.seat.seatId : `${row.row}-${index}`"
          >
            <span
              v-if="cell.kind === 'aisle'"
              class="airline-seat-row__aisle"
            >
              <span
                v-if="section.cabin === 'Exit'"
                class="airline-exit-mark"
              >EXIT</span>
            </span>
            <AircraftSeat
              v-else-if="cell.kind === 'seat'"
              :seat="cell.seat"
              :state="visualFor(cell.seat)"
              :price-wei="priceFor(cell.seat)"
              @select="emit('select', $event)"
            />
            <span
              v-else
              class="airline-seat-row__empty"
              aria-hidden="true"
            />
          </template>
        </div>
      </section>

      <p class="airline-aircraft__cue airline-label">
        Rear galley · Lavatory
      </p>
    </div>
  </div>
</template>
