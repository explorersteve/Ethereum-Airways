<script setup lang="ts">
const items = [
  { id: "available", label: "Available" },
  { id: "selected", label: "Selected" },
  { id: "occupied", label: "Unavailable" },
  { id: "first", label: "First" },
  { id: "comfort", label: "Comfort" },
  { id: "exit", label: "Exit" },
] as const;
</script>

<template>
  <ul class="airline-seat-legend">
    <li
      v-for="item in items"
      :key="item.id"
      :data-legend="item.id"
    >
      <span
        class="airline-seat-legend__swatch"
        :data-legend="item.id"
        aria-hidden="true"
      >
        <span
          v-if="item.id === 'selected'"
          class="airline-seat__glyph"
        >
          <svg
            viewBox="0 0 16 16"
            width="10"
            height="10"
          >
            <path
              d="M3.2 8.4 6.1 11.2 12.8 4.6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span
          v-else-if="item.id === 'occupied'"
          class="airline-seat__x"
        >×</span>
        <span
          v-else-if="item.id === 'first'"
          class="airline-seat__mark airline-seat__mark--first"
        />
        <span
          v-else-if="item.id === 'comfort'"
          class="airline-seat__mark airline-seat__mark--comfort"
        />
        <span
          v-else-if="item.id === 'exit'"
          class="airline-seat__mark airline-seat__mark--exit"
        />
      </span>
      {{ item.label }}
    </li>
  </ul>
</template>
