<script setup lang="ts">
import { FLIGHT } from "~/lib/booking/flight";
</script>

<template>
  <Card class="airline-search">
    <header>
      <p class="airline-label">Book</p>
      <h2>Find your flight</h2>
    </header>
    <Form
      class="airline-search__form"
      @submit.prevent
    >
      <FormLabel label="Trip type">
        <FormItem>
          <input
            :value="FLIGHT.tripType"
            readonly
            tabindex="0"
            aria-readonly="true"
          >
        </FormItem>
      </FormLabel>
      <FormLabel label="From">
        <FormItem>
          <input
            :value="FLIGHT.origin"
            readonly
            tabindex="0"
            aria-readonly="true"
          >
        </FormItem>
      </FormLabel>
      <FormLabel label="To">
        <FormItem>
          <input
            :value="FLIGHT.destination"
            readonly
            tabindex="0"
            aria-readonly="true"
          >
        </FormItem>
      </FormLabel>
      <FormLabel label="When">
        <FormItem>
          <input
            :value="FLIGHT.departure"
            readonly
            tabindex="0"
            aria-readonly="true"
          >
        </FormItem>
      </FormLabel>
      <FormLabel label="Travelers">
        <FormItem>
          <input
            :value="`${FLIGHT.travelers} Adult`"
            readonly
            tabindex="0"
            aria-readonly="true"
          >
        </FormItem>
      </FormLabel>
      <Button
        class="primary airline-search__cta"
        to="/flights"
      >
        Search Flights
      </Button>
    </Form>
  </Card>
</template>
