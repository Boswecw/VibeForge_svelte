<!-- @component
### Props
- `! activePresetId` **string | null**
- `! presets` **Preset[]**
- `onSelectPreset` **(id: string) =► void** = `() =► {}`
- `onTogglePinned` **(id: string) =► void** = `() =► {}`

List of preset cards with selection and pin toggle
-->
<script lang="ts">
  import { theme } from "$lib/stores/themeStore";
  import type { Preset } from "$lib/stores/presets";

  interface Props {
    presets: Preset[];
    activePresetId: string | null;
    onSelectPreset?: (id: string) => void;
    onTogglePinned?: (id: string) => void;
  }

  const {
    presets,
    activePresetId,
    onSelectPreset = () => {},
    onTogglePinned = () => {},
  }: Props = $props();
</script>

<!-- Presets list -->
<div class="px-4 pb-3 overflow-y-auto flex-1 flex flex-col gap-2">
  {#if presets.length === 0}
    <div class="flex items-center justify-center py-8">
      <p
        class={`text-[11px] ${
          $theme === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        No presets available in this view.
      </p>
    </div>
  {:else}
    {#each presets as preset (preset.id)}
      <div
        class={`w-full text-left rounded-md border px-3 py-2 flex flex-col gap-1 text-[11px] transition-colors cursor-pointer ${
          activePresetId === preset.id
            ? $theme === "dark"
              ? "border-amber-400 bg-slate-900"
              : "border-amber-500 bg-amber-50"
            : $theme === "dark"
            ? "border-slate-700 bg-slate-950 hover:bg-slate-900 hover:border-slate-600"
            : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
        }`}
        role="button"
        tabindex="0"
        onclick={() => onSelectPreset(preset.id)}
        onkeydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectPreset(preset.id);
          }
        }}
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-[13px] font-medium truncate">{preset.name}</span>
          <button
            type="button"
            class={`text-[11px] font-medium flex-shrink-0 transition-colors ${
              preset.pinned
                ? $theme === "dark"
                  ? "text-amber-400 hover:text-amber-300"
                  : "text-amber-600 hover:text-amber-700"
                : $theme === "dark"
                ? "text-slate-400 hover:text-amber-400"
                : "text-slate-400 hover:text-amber-600"
            }`}
            onclick={(e) => {
              e.stopPropagation();
              onTogglePinned(preset.id);
            }}
            title={preset.pinned ? "Unpin preset" : "Pin preset"}
          >
            {preset.pinned ? "★" : "☆"}
          </button>
        </div>

        <div
          class={`flex items-center justify-between gap-2 text-[10px] ${
            $theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <span>{preset.category} · {preset.workspace}</span>
          <span class="flex-shrink-0">{preset.updatedAt}</span>
        </div>

        {#if preset.tags?.length}
          <div class="flex flex-wrap gap-1">
            {#each preset.tags as tag (tag)}
              <span
                class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] ${
                  $theme === "dark"
                    ? "border-slate-700 text-slate-300"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                {tag}
              </span>
            {/each}
          </div>
        {/if}

        <p
          class={`text-[10px] line-clamp-2 ${
            $theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {preset.description}
        </p>
      </div>
    {/each}
  {/if}
</div>
