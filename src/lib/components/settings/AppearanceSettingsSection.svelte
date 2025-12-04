<!-- @component
no description yet
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";

  // Local state for appearance settings
  let selectedTheme = $state<"dark" | "light" | "system">("dark");
  let density = $state<"comfortable" | "compact">("comfortable");
  let showTokenEstimates = $state(true);
  let showAdvancedMetadata = $state(false);
  let highlightPreferred = $state(true);

  // Const arrays for options
  const themeOptions = ["dark", "light", "system"] as const;
  const densityOptions = ["comfortable", "compact"] as const;

  // Sync local state with actual theme when component mounts
  $effect(() => {
    selectedTheme = themeStore.current as "dark" | "light" | "system";
  });

  const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
    selectedTheme = newTheme;
    if (newTheme === "dark" || newTheme === "light") {
      themeStore.setTheme(newTheme);
    }
    // TODO: System theme detection and automatic switching
  };
</script>

<!-- Appearance & Layout section -->
<section
  class={`rounded-lg border p-4 flex flex-col gap-3 transition-colors ${
    themeStore.current === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  <div class="flex flex-col gap-1">
    <h2
      class={`text-sm font-semibold ${
        themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Appearance & Layout
    </h2>
    <p
      class={`text-xs ${
        themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      Customize theme, density, and visual elements.
    </p>
  </div>

  <div class="flex flex-col gap-4">
    <!-- Theme selection -->
    <div class="flex flex-col gap-1.5">
      <label
        class={`text-xs font-medium ${
          themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Theme
      </label>
      <div class="flex gap-2">
        {#each themeOptions as themeOption}
          <button
            type="button"
            class={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              selectedTheme === themeOption
                ? themeStore.current === "dark"
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-amber-50 border-amber-400 text-amber-700"
                : themeStore.current === "dark"
                ? "bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-900"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
            }`}
            onclick={() => handleThemeChange(themeOption)}
          >
            {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
          </button>
        {/each}
      </div>
      <p
        class={`text-[11px] ${
          themeStore.current === "dark" ? "text-slate-500" : "text-slate-600"
        }`}
      >
        Choose between Dark, Light, or System-based theme.
      </p>
    </div>

    <!-- Density -->
    <div class="flex flex-col gap-1.5">
      <label
        class={`text-xs font-medium ${
          themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Layout Density
      </label>
      <div class="flex gap-2">
        {#each densityOptions as densityOption}
          <button
            type="button"
            class={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              density === densityOption
                ? themeStore.current === "dark"
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-amber-50 border-amber-400 text-amber-700"
                : themeStore.current === "dark"
                ? "bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-900"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
            }`}
            onclick={() => (density = densityOption)}
          >
            {densityOption.charAt(0).toUpperCase() + densityOption.slice(1)}
          </button>
        {/each}
      </div>
      <p
        class={`text-[11px] ${
          themeStore.current === "dark" ? "text-slate-500" : "text-slate-600"
        }`}
      >
        Comfortable adds more breathing room; Compact reduces spacing.
      </p>
      <!-- TODO: Apply density to layout via CSS variables or class -->
    </div>

    <!-- Visibility toggles -->
    <div
      class="flex flex-col gap-2 border-t pt-3 border-slate-700"
      class:border-slate-200={themeStore.current !== "dark"}
    >
      <div class="flex items-center justify-between gap-2">
        <div>
          <label
            class={`text-xs font-medium ${
              themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Show Token Estimates
          </label>
          <p
            class={`text-[11px] ${
              themeStore.current === "dark" ? "text-slate-500" : "text-slate-600"
            }`}
          >
            Display estimated token counts in Workbench
          </p>
        </div>
        <button
          type="button"
          class={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            showTokenEstimates
              ? themeStore.current === "dark"
                ? "bg-green-500/20 border border-green-600 text-green-300"
                : "bg-green-50 border border-green-300 text-green-700"
              : themeStore.current === "dark"
              ? "bg-slate-950 border border-slate-700 text-slate-400"
              : "bg-slate-50 border border-slate-200 text-slate-600"
          }`}
          onclick={() => (showTokenEstimates = !showTokenEstimates)}
        >
          {showTokenEstimates ? "✓" : "○"}
        </button>
      </div>

      <div class="flex items-center justify-between gap-2">
        <div>
          <label
            class={`text-xs font-medium ${
              themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Show Advanced Metadata
          </label>
          <p
            class={`text-[11px] ${
              themeStore.current === "dark" ? "text-slate-500" : "text-slate-600"
            }`}
          >
            Display detailed metadata in History and Evaluations
          </p>
        </div>
        <button
          type="button"
          class={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            showAdvancedMetadata
              ? themeStore.current === "dark"
                ? "bg-green-500/20 border border-green-600 text-green-300"
                : "bg-green-50 border border-green-300 text-green-700"
              : themeStore.current === "dark"
              ? "bg-slate-950 border border-slate-700 text-slate-400"
              : "bg-slate-50 border border-slate-200 text-slate-600"
          }`}
          onclick={() => (showAdvancedMetadata = !showAdvancedMetadata)}
        >
          {showAdvancedMetadata ? "✓" : "○"}
        </button>
      </div>

      <div class="flex items-center justify-between gap-2">
        <div>
          <label
            class={`text-xs font-medium ${
              themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Highlight Preferred Model
          </label>
          <p
            class={`text-[11px] ${
              themeStore.current === "dark" ? "text-slate-500" : "text-slate-600"
            }`}
          >
            Emphasize winner selections in Evaluations
          </p>
        </div>
        <button
          type="button"
          class={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            highlightPreferred
              ? themeStore.current === "dark"
                ? "bg-green-500/20 border border-green-600 text-green-300"
                : "bg-green-50 border border-green-300 text-green-700"
              : themeStore.current === "dark"
              ? "bg-slate-950 border border-slate-700 text-slate-400"
              : "bg-slate-50 border border-slate-200 text-slate-600"
          }`}
          onclick={() => (highlightPreferred = !highlightPreferred)}
        >
          {highlightPreferred ? "✓" : "○"}
        </button>
      </div>
    </div>
  </div>

  <!-- TODO: Persist appearance settings -->
  <p
    class={`text-[11px] ${
      themeStore.current === "dark" ? "text-slate-600" : "text-slate-500"
    }`}
  >
    💾 TODO: Save these preferences and apply density CSS on page load
  </p>
</section>
