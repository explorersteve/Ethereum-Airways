/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bookings from "../bookings.js";
import type * as crons from "../crons.js";
import type * as lib_abi from "../lib/abi.js";
import type * as lib_ids from "../lib/ids.js";
import type * as lib_mints from "../lib/mints.js";
import type * as lib_passenger from "../lib/passenger.js";
import type * as lib_rpc from "../lib/rpc.js";
import type * as lib_seatIndexWrite from "../lib/seatIndexWrite.js";
import type * as lib_seats from "../lib/seats.js";
import type * as lib_validators from "../lib/validators.js";
import type * as mints from "../mints.js";
import type * as seats from "../seats.js";
import type * as sync from "../sync.js";
import type * as syncState from "../syncState.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bookings: typeof bookings;
  crons: typeof crons;
  "lib/abi": typeof lib_abi;
  "lib/ids": typeof lib_ids;
  "lib/mints": typeof lib_mints;
  "lib/passenger": typeof lib_passenger;
  "lib/rpc": typeof lib_rpc;
  "lib/seatIndexWrite": typeof lib_seatIndexWrite;
  "lib/seats": typeof lib_seats;
  "lib/validators": typeof lib_validators;
  mints: typeof mints;
  seats: typeof seats;
  sync: typeof sync;
  syncState: typeof syncState;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
