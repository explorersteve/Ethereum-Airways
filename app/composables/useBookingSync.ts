import { api } from "../../convex/_generated/api";
import { passengerDraftArgs, sessionMutationArgs } from "~/lib/booking/sessionArgs";
import type { SessionStatus } from "~/lib/booking/sessionArgs";

export function useBookingSync() {
  const booking = useBooking();
  const { mutate: upsertSession, isPending: sessionPending } = useConvexMutation(
    api.bookings.upsertSession,
  );
  const { mutate: savePassengerDraft, isPending: draftPending } =
    useConvexMutation(api.bookings.savePassengerDraft);
  const { data, isPending, error } = useConvexQuery(
    api.bookings.getSession,
    () => ({ sessionId: booking.state.value.sessionId }),
    { server: false },
  );

  const appliedRemote = useState("booking-remote-applied", () => false);

  watch(
    data,
    (remote) => {
      if (remote === undefined || appliedRemote.value) {
        return;
      }
      if (remote) {
        booking.hydrateFromRemote(remote);
      }
      appliedRemote.value = true;
    },
    { immediate: true },
  );

  async function syncSession(status: SessionStatus) {
    await upsertSession(sessionMutationArgs(booking.state.value, status));
  }

  async function syncTraveler() {
    await savePassengerDraft(passengerDraftArgs(booking.state.value));
    await syncSession("traveler");
  }

  const isSavingDraft = computed(
    () => draftPending.value || sessionPending.value,
  );

  return {
    ...booking,
    remote: data,
    isDraftPending: isPending,
    draftError: error,
    isSessionPending: sessionPending,
    isSavingDraft,
    syncSession,
    syncTraveler,
  };
}
