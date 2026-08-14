<script setup lang="ts">
import {
  canonicalHandle,
  derivedBirthday,
  NAME_MAX_BYTES,
  nameByteCount,
  travelerFieldErrors,
  travelerFieldsAreValid,
} from "~/lib/booking/travelerFields";

const props = defineProps<{
  pending?: boolean;
}>();

const emit = defineEmits<{
  continue: [];
}>();

const { state, setTraveler } = useBooking();

const fullName = ref(state.value.fullName);
const dateOfBirthISO = ref(state.value.dateOfBirthISO);
const twitterHandle = ref(state.value.twitterHandle);
const submitted = ref(false);

watch(
  () => state.value.fullName,
  (name) => {
    if (fullName.value.trim().length === 0 && name.length > 0) {
      fullName.value = name;
    }
  },
);

watch(
  () => state.value.dateOfBirthISO,
  (iso) => {
    if (dateOfBirthISO.value.length === 0 && iso.length > 0) {
      dateOfBirthISO.value = iso;
    }
  },
);

watch(
  () => state.value.twitterHandle,
  (handle) => {
    if (twitterHandle.value.trim().length === 0 && handle.length > 0) {
      twitterHandle.value = handle;
    }
  },
);

const errors = computed(() =>
  travelerFieldErrors({
    fullName: fullName.value,
    dateOfBirthISO: dateOfBirthISO.value,
    twitterHandle: twitterHandle.value,
  }),
);

const birthday = computed(() => derivedBirthday(dateOfBirthISO.value));
const nameCount = computed(() => nameByteCount(fullName.value));
const canSubmit = computed(() => travelerFieldsAreValid(errors.value));

function persistTraveler() {
  setTraveler({
    fullName: fullName.value,
    dateOfBirthISO: dateOfBirthISO.value,
    twitterHandle: canonicalHandle(twitterHandle.value),
  });
}

function onHandleBlur() {
  twitterHandle.value = canonicalHandle(twitterHandle.value);
  persistTraveler();
}

function onSubmit() {
  submitted.value = true;
  persistTraveler();
  if (!canSubmit.value || props.pending) {
    return;
  }
  emit("continue");
}
</script>

<template>
  <Form
    class="airline-traveler"
    @submit.prevent="onSubmit"
  >
    <header>
      <h1>Traveler information</h1>
      <p>
        Enter the name exactly as it appears on your travel document. Date of
        birth is asked once; your birthday on the pass is derived from it.
      </p>
    </header>

    <p
      class="airline-traveler__privacy"
      role="note"
    >
      Passenger details are written permanently to a public blockchain at
      purchase. They cannot be deleted later.
    </p>

    <FormLabel label="Full legal name">
      <FormItem>
        <input
          v-model="fullName"
          name="fullName"
          autocomplete="name"
          required
          aria-describedby="name-count name-error"
          @blur="persistTraveler"
        >
      </FormItem>
      <span
        id="name-count"
        class="airline-traveler__count"
      >
        {{ nameCount }} / {{ NAME_MAX_BYTES }}
      </span>
      <p
        v-if="submitted && errors.fullName"
        id="name-error"
        class="airline-traveler__error"
      >
        {{ errors.fullName }}
      </p>
    </FormLabel>

    <FormLabel label="Date of birth">
      <FormItem>
        <input
          v-model="dateOfBirthISO"
          type="date"
          name="dateOfBirth"
          autocomplete="bday"
          required
          aria-describedby="dob-hint dob-error"
          @blur="persistTraveler"
        >
      </FormItem>
      <p
        id="dob-hint"
        class="airline-traveler__hint"
      >
        Birthday on pass:
        {{ birthday ?? "derived after you enter a date" }}
      </p>
      <p
        v-if="submitted && errors.dateOfBirthISO"
        id="dob-error"
        class="airline-traveler__error"
      >
        {{ errors.dateOfBirthISO }}
      </p>
    </FormLabel>

    <FormLabel label="X handle">
      <FormItem>
        <template #prefix>@</template>
        <input
          v-model="twitterHandle"
          name="twitterHandle"
          autocomplete="username"
          spellcheck="false"
          aria-describedby="handle-hint handle-error"
          @blur="onHandleBlur"
        >
      </FormItem>
      <p
        id="handle-hint"
        class="airline-traveler__hint"
      >
        Optional. Enter <code>user</code> or <code>@user</code> — we keep the
        canonical form.
      </p>
      <p
        v-if="submitted && errors.twitterHandle"
        id="handle-error"
        class="airline-traveler__error"
      >
        {{ errors.twitterHandle }}
      </p>
    </FormLabel>

    <footer>
      <Button
        class="primary"
        :disabled="pending"
      >
        {{ pending ? "Saving…" : "Continue" }}
      </Button>
    </footer>
  </Form>
</template>
