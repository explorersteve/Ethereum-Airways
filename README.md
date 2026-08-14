# Ethereum Airways

Airline booking site for an onchain boarding pass. Ethereum is the ownership
authority; this frontend never submits a locally computed fare as `msg.value`.

## Privacy consent

The checkout checkbox is **product disclosure**, not an onchain permission.
Direct `bookAndMint` callers bypass it. Passenger name, date of birth, and
handle are written permanently to Ethereum and may not be removable.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
