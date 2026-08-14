<script setup lang="ts">
import {
  BOOKING_STEPS,
  bookingStepIndex,
  bookingStepState,
  type BookingStepId,
} from "../lib/booking/progress";

const props = defineProps<{
  step: BookingStepId;
}>();

const currentIndex = computed(() => bookingStepIndex(props.step));
</script>

<template>
  <nav
    class="airline-progress"
    aria-label="Booking progress"
  >
    <p class="airline-progress__mobile">
      Step {{ currentIndex + 1 }} / {{ BOOKING_STEPS.length }}
    </p>
    <ol>
      <li
        v-for="item in BOOKING_STEPS"
        :key="item.id"
        :data-state="bookingStepState(item.id, step)"
        :aria-current="item.id === step ? 'step' : undefined"
      >
        <span
          v-if="item.id !== BOOKING_STEPS[0].id"
          class="airline-progress__rule"
          aria-hidden="true"
        />
        <span class="airline-progress__step">
          <span class="airline-progress__index">
            {{ bookingStepIndex(item.id) + 1 }}
          </span>
          <span class="airline-progress__label">{{ item.label }}</span>
        </span>
      </li>
    </ol>
  </nav>
</template>
