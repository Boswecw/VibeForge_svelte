<!-- @component
no description yet
-->
<script lang="ts">
  import { theme } from "$lib/stores/themeStore";

  interface Model {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    apiKey: string;
    endpoint: string;
  }

  let models = $state<Model[]>([
    {
      id: "claude",
      name: "Claude",
      description: "Anthropic Claude model family",
      enabled: true,
      apiKey: "",
      endpoint: "https://api.anthropic.com",
    },
    {
      id: "gpt",
      name: "GPT-5.x",
      description: "OpenAI GPT-5 models",
      enabled: true,
      apiKey: "",
      endpoint: "https://api.openai.com",
    },
    {
      id: "local",
      name: "Local",
      description: "Local LLM via Ollama or similar",
      enabled: false,
      apiKey: "",
      endpoint: "http://localhost:11434",
    },
  ]);

  // Mask API key for display
  const maskApiKey = (key: string) => {
    if (!key) return "";
    if (key.length < 8) return "•".repeat(key.length);
    return (
      key.substring(0, 4) +
      "•".repeat(Math.max(4, key.length - 8)) +
      key.substring(key.length - 4)
    );
  };
</script>

<!-- Model & API Settings section -->
<section
  class={`rounded-lg border p-4 flex flex-col gap-3 transition-colors ${
    $theme === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  <div class="flex flex-col gap-1">
    <h2
      class={`text-sm font-semibold ${
        $theme === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Model & API Settings
    </h2>
    <p
      class={`text-xs ${
        $theme === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      Configure API keys and endpoints for each model. Keys are stored locally
      only.
    </p>
  </div>

  <div class="flex flex-col gap-2">
    {#each models as model (model.id)}
      <div
        class={`rounded-md border p-3 flex flex-col gap-2 transition-colors ${
          $theme === "dark"
            ? "bg-slate-950 border-slate-800"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <!-- Model header with toggle -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex flex-col gap-0.5">
            <span
              class={`font-semibold text-xs ${
                $theme === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {model.name}
            </span>
            <span
              class={`text-[11px] ${
                $theme === "dark" ? "text-slate-500" : "text-slate-600"
              }`}
            >
              {model.description}
            </span>
          </div>
          <label
            class={`inline-flex items-center gap-1.5 text-[11px] font-medium cursor-pointer ${
              model.enabled
                ? $theme === "dark"
                  ? "text-amber-300"
                  : "text-amber-700"
                : $theme === "dark"
                ? "text-slate-400"
                : "text-slate-600"
            }`}
          >
            <input
              type="checkbox"
              bind:checked={model.enabled}
              class="w-3.5 h-3.5 accent-amber-500"
            />
            <span>Enabled</span>
          </label>
        </div>

        <!-- API inputs -->
        <div class="grid sm:grid-cols-2 grid-cols-1 gap-2">
          <div class="flex flex-col gap-1">
            <label
              class={`text-[11px] font-medium ${
                $theme === "dark" ? "text-slate-300" : "text-slate-700"
              }`}
            >
              API Key
            </label>
            <input
              type="password"
              bind:value={model.apiKey}
              placeholder="••••••••••••"
              disabled={!model.enabled}
              class={`rounded-md border px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                $theme === "dark"
                  ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600 disabled:opacity-50"
                  : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
              }`}
            />
            {#if model.apiKey}
              <p
                class={`text-[10px] ${
                  $theme === "dark" ? "text-slate-600" : "text-slate-500"
                }`}
              >
                {maskApiKey(model.apiKey)}
              </p>
            {/if}
          </div>
          <div class="flex flex-col gap-1">
            <label
              class={`text-[11px] font-medium ${
                $theme === "dark" ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Endpoint URL
            </label>
            <input
              type="text"
              bind:value={model.endpoint}
              placeholder="https://api.example.com"
              disabled={!model.enabled}
              class={`rounded-md border px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                $theme === "dark"
                  ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600 disabled:opacity-50"
                  : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
              }`}
            />
          </div>
        </div>

        <!-- TODO comment -->
        <p
          class={`text-[10px] ${
            $theme === "dark" ? "text-slate-700" : "text-slate-400"
          }`}
        >
          💾 TODO: Encrypt and persist credentials securely
        </p>
      </div>
    {/each}
  </div>

  <div
    class={`rounded-md border p-3 ${
      $theme === "dark"
        ? "bg-slate-950/50 border-slate-800 text-slate-400"
        : "bg-blue-50 border-blue-200 text-blue-700"
    }`}
  >
    <p class="text-xs">
      <span class="font-semibold">ℹ️ Note:</span> API keys are stored locally in
      this browser only. They are never sent to VibeForge servers.
    </p>
  </div>
</section>
