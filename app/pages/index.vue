<template>
  <main>
    <h1>Ethereum Airways</h1>
    <EvmConnectDialog>
      <template #connected="{ address }">
        <EvmProfile />
        <EvmAccount
          :address="address"
          resolve-ens
        />
        <EvmSwitchNetwork />
      </template>
    </EvmConnectDialog>
  </main>
</template>
