<!-- @component
no description yet
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import WizardShell from "./WizardShell.svelte";

  export let visible = false;

  const dispatch = createEventDispatcher();

  function close() {
    visible = false;
    dispatch("close");
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      close();
    }
  }
</script>

{#if visible}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="relative w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Close Button -->
      <button
        class="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        onclick={close}
        aria-label="Close wizard"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- Wizard Content -->
      <div class="w-full h-full">
        <WizardShell />
      </div>
    </div>
  </div>
{/if}

<style>
  /* Prevent body scroll when overlay is open */
  :global(body:has(.fixed.z-50)) {
    overflow: hidden;
  }
</style>
