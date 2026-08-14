import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "reconcile boarding passes",
  { minutes: 5 },
  internal.sync.reconcile,
  {},
);

export default crons;
