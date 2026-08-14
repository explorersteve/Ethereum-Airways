<template>
  <div class="airline-home">
    <BookingProgress step="search" />
    <section class="airline-home__hero">
      <AviationHero />
      <div class="airline-home__copy">
        <p class="airline-label">Ethereum Airways</p>
        <h1>Where are you going?</h1>
        <p>
          Nonstop from Current Location to Ethereum. One adult, departing now.
        </p>
      </div>
      <BookingSearch />
    </section>
    <section
      class="airline-home__values"
      aria-label="Why fly with us"
    >
      <article>
        <p class="airline-label">Schedule</p>
        <h2>Ready when you are</h2>
        <p>Depart now, arrive now. No calendars, no connections to juggle.</p>
      </article>
      <article>
        <p class="airline-label">Cabin</p>
        <h2>Main Cabin, plainly priced</h2>
        <p>One round-trip fare you can see before you choose a seat.</p>
      </article>
      <article>
        <p class="airline-label">Travelers</p>
        <h2>One adult, one booking</h2>
        <p>A short trip file: your name, date of birth, and optional handle.</p>
      </article>
    </section>
  </div>
</template>
