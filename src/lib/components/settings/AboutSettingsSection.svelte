<!-- @component
About VibeForge - Forge-built Standards section
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";
  import { browser } from "$app/environment";

  const FORGE_CHARTER_URL = "https://forge.boswelldigital.com/forge/charter/";

  /**
   * Opens the Forge Brand Charter in an external browser
   */
  function openForgeCharter() {
    if (browser) {
      // Works in both browser and Tauri contexts
      window.open(FORGE_CHARTER_URL, "_blank", "noopener,noreferrer");
    }
  }
</script>

<!-- About / Forge-built Standard section -->
<section
  class={`rounded-lg border p-4 flex flex-col gap-4 transition-colors ${
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
      About VibeForge
    </h2>
    <p
      class={`text-xs ${
        themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      Version, standards, and build information.
    </p>
  </div>

  <!-- Forge-built Standard Section -->
  <div
    class={`rounded-md border p-4 flex flex-col gap-3 ${
      themeStore.current === "dark"
        ? "bg-slate-950/50 border-slate-800"
        : "bg-slate-50 border-slate-200"
    }`}
  >
    <div class="flex items-start gap-3">
      <!-- Anvil Seal - 32px meaningful icon -->
      <!-- SVG uses currentColor, so we set color via CSS -->
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        role="img"
        aria-label="Forge-built"
        class={themeStore.current === "dark" ? "text-slate-300" : "text-slate-600"}
      >
        <path d="M6 24h20v3H6z" fill="currentColor"/>
        <path d="M8 16h16v8H8z" fill="currentColor"/>
        <path d="M8 12h4v4H8z" fill="currentColor"/>
        <path d="M10 8h12l2 4H8z" fill="currentColor"/>
        <path d="M20 12h4v4h-4z" fill="currentColor"/>
      </svg>
      <div class="flex flex-col gap-2 flex-1">
        <h3
          class={`text-xs font-semibold ${
            themeStore.current === "dark" ? "text-slate-200" : "text-slate-800"
          }`}
        >
          Forge-built Standard
        </h3>
        <p
          class={`text-xs leading-relaxed ${
            themeStore.current === "dark" ? "text-slate-400" : "text-slate-600"
          }`}
        >
          VibeForge is built under Forge standards: durability, inspectability, and long-term trust. AI assists, proposes, and accelerates—but never silently overrides your intent. Defaults are conservative, and irreversible actions require explicit confirmation.
        </p>
      </div>
    </div>

    <!-- Charter Link -->
    <button
      type="button"
      onclick={openForgeCharter}
      class={`self-start flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
        themeStore.current === "dark"
          ? "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      Read the Forge Brand Charter →
    </button>
  </div>

  <!-- Version Info -->
  <div
    class="flex items-center justify-between border-t pt-3"
    class:border-slate-700={themeStore.current === "dark"}
    class:border-slate-200={themeStore.current !== "dark"}
  >
    <span
      class={`text-xs ${
        themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      VibeForge v0.1.0
    </span>
    <span
      class={`text-[10px] ${
        themeStore.current === "dark" ? "text-slate-500" : "text-slate-400"
      }`}
    >
      SvelteKit + Tauri
    </span>
  </div>
</section>
