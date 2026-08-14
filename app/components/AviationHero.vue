<template>
  <div
    class="airline-hero-visual"
    aria-hidden="true"
  >
    <svg
      class="airline-hero-visual__svg"
      viewBox="0 0 960 420"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <defs>
        <linearGradient
          id="airline-sky"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="var(--airline-ink)"
          />
          <stop
            offset="62%"
            stop-color="var(--airline-accent)"
            stop-opacity="0.88"
          />
          <stop
            offset="100%"
            stop-color="var(--airline-rail)"
          />
        </linearGradient>
      </defs>
      <rect
        width="960"
        height="420"
        rx="10"
        fill="url(#airline-sky)"
      />
      <path
        d="M0 292 C180 248 310 318 480 286 C650 254 780 312 960 268 L960 420 L0 420 Z"
        fill="var(--airline-surface)"
        opacity="0.92"
      />
      <path
        d="M0 318 C220 286 360 340 520 308 C690 274 820 328 960 300"
        fill="none"
        stroke="var(--airline-white)"
        stroke-width="1.25"
        opacity="0.45"
      />
      <g fill="var(--airline-white)">
        <path d="M168 148 L412 128 L398 148 L186 164 Z" />
        <path d="M412 128 L702 162 L678 178 L398 148 Z" />
        <path d="M318 138 L292 92 L312 92 L348 138 Z" />
        <path d="M548 148 L720 96 L736 108 L572 164 Z" />
        <rect
          x="390"
          y="146"
          width="86"
          height="8"
          rx="2"
        />
      </g>
      <circle
        cx="786"
        cy="92"
        r="18"
        fill="var(--airline-white)"
        opacity="0.22"
      />
    </svg>
  </div>
</template>
