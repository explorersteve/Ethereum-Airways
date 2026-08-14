<script setup lang="ts">
const open = ref(false);

const close = () => {
  open.value = false;
};
</script>

<template>
  <header class="airline-header">
    <NuxtLink
      to="/"
      class="airline-wordmark"
      @click="close"
    >
      <img
        src="/icon.svg"
        alt=""
        width="32"
        height="32"
      >
      <span class="airline-wordmark__name">
        Ethereum Airways
        <small>ETHAIR</small>
      </span>
    </NuxtLink>

    <Button
      class="airline-header__menu tertiary small"
      :aria-expanded="open"
      aria-controls="airline-mobile-nav"
      aria-label="Menu"
      @click="open = !open"
    >
      <Icon :name="open ? 'close' : 'menu'" />
    </Button>

    <nav
      class="airline-nav"
      aria-label="Primary"
    >
      <NuxtLink to="/">Book</NuxtLink>
      <NuxtLink to="/my-trips">My trips</NuxtLink>
      <Tooltip>
        <template #trigger>
          <span
            class="airline-nav__soon"
            tabindex="0"
          >Check in</span>
        </template>
        Coming soon
      </Tooltip>
      <Tooltip>
        <template #trigger>
          <span
            class="airline-nav__soon"
            tabindex="0"
          >Flight status</span>
        </template>
        Coming soon
      </Tooltip>
    </nav>

    <div class="airline-header__wallet">
      <EvmConnectDialog class-name="wallet-button">
        Sign in
        <template #connected="{ address }">
          <EvmProfile class-name="wallet-button">
            <EvmAccount
              :address="address"
              resolve-ens
            />
          </EvmProfile>
        </template>
      </EvmConnectDialog>
    </div>

    <div
      id="airline-mobile-nav"
      class="airline-header__drawer"
      :hidden="!open"
    >
      <nav
        class="airline-nav"
        aria-label="Mobile"
      >
        <NuxtLink
          to="/"
          @click="close"
        >
          Book
        </NuxtLink>
        <NuxtLink
          to="/my-trips"
          @click="close"
        >
          My trips
        </NuxtLink>
        <Tooltip>
          <template #trigger>
            <span
              class="airline-nav__soon"
              tabindex="0"
            >Check in</span>
          </template>
          Coming soon
        </Tooltip>
        <Tooltip>
          <template #trigger>
            <span
              class="airline-nav__soon"
              tabindex="0"
            >Flight status</span>
          </template>
          Coming soon
        </Tooltip>
      </nav>
    </div>
  </header>
</template>
