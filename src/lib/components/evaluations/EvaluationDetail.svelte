<!-- @component
### Props
- `! evaluation` **EvaluationSession**
- `! onUpdateNotes` **(notes: string) =► void**
- `! onUpdateOutput` **(outputId: string, updates: Record◄string, any►) =► void**

no description yet
-->
<script lang="ts">
  import { theme } from "$lib/stores/themeStore";
  import type { EvaluationSession } from "$lib/types/evaluation";

  interface Props {
    evaluation: EvaluationSession;
    onUpdateOutput: (outputId: string, updates: Record<string, any>) => void;
    onUpdateNotes: (notes: string) => void;
  }

  let { evaluation, onUpdateOutput, onUpdateNotes }: Props = $props();

  let localNotes = $state(evaluation.notes ?? "");

  // Score buttons handler
  const setScore = (outputId: string, score: number) => {
    const output = evaluation.outputs.find((o) => o.id === outputId);
    if (output?.score === score) {
      // Toggle off if clicking same score
      onUpdateOutput(outputId, { score: undefined });
    } else {
      onUpdateOutput(outputId, { score });
    }
  };

  // Toggle winner
  const toggleWinner = (outputId: string) => {
    const output = evaluation.outputs.find((o) => o.id === outputId);
    if (output?.isWinner) {
      onUpdateOutput(outputId, { isWinner: false });
    } else {
      // Unmark any other winners
      evaluation.outputs.forEach((o) => {
        if (o.id !== outputId && o.isWinner) {
          onUpdateOutput(o.id, { isWinner: false });
        }
      });
      // Mark this one as winner
      onUpdateOutput(outputId, { isWinner: true });
    }
  };

  // Save notes locally
  const saveNotes = () => {
    onUpdateNotes(localNotes);
  };
</script>

<!-- Evaluation detail workspace -->
<section
  class={`rounded-lg border p-4 flex flex-col gap-4 transition-colors ${
    $theme === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  <!-- Header with evaluation metadata -->
  <header class="flex flex-col gap-1.5">
    <h2
      class={`text-sm font-semibold ${
        $theme === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {evaluation.name}
    </h2>
    <p
      class={`text-xs ${
        $theme === "dark" ? "text-slate-400" : "text-slate-600"
      }`}
    >
      Workspace: <span class="font-mono text-[11px]"
        >{evaluation.workspace}</span
      >
      {#if evaluation.project}
        · Project: <span class="font-mono text-[11px]"
          >{evaluation.project}</span
        >
      {/if}
      · Models:
      <span class="font-mono text-[11px]">{evaluation.models.join(", ")}</span>
    </p>
    <p
      class={`text-[11px] ${
        $theme === "dark" ? "text-slate-500" : "text-slate-500"
      }`}
    >
      Status: {evaluation.status}
      · Created {new Date(evaluation.createdAt).toLocaleDateString()}
      · Updated {new Date(evaluation.updatedAt).toLocaleDateString()}
    </p>
  </header>

  <hr
    class={`border-t ${
      $theme === "dark" ? "border-slate-700" : "border-slate-200"
    }`}
  />

  <!-- Prompt section -->
  <section class="flex flex-col gap-1.5">
    <h3
      class={`text-xs font-semibold ${
        $theme === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Prompt
    </h3>
    <div
      class={`rounded-md border p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[140px] ${
        $theme === "dark"
          ? "bg-slate-950 border-slate-800 text-slate-100"
          : "bg-slate-50 border-slate-200 text-slate-900"
      }`}
    >
      {evaluation.prompt}
    </div>
  </section>

  <!-- Context section -->
  <section class="flex flex-col gap-1.5">
    <h3
      class={`text-xs font-semibold ${
        $theme === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Context
    </h3>
    {#if evaluation.contextBlocks?.length}
      <div class="flex flex-wrap gap-2">
        {#each evaluation.contextBlocks as block}
          <span
            class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${
              $theme === "dark"
                ? "border-slate-700 bg-slate-950 text-slate-300"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            <span class="font-medium">{block.name}</span>
            <span
              class={`ml-1 text-[10px] ${
                $theme === "dark" ? "text-slate-500" : "text-slate-500"
              }`}
            >
              ({block.type})
            </span>
          </span>
        {/each}
      </div>
    {:else}
      <p
        class={`text-[11px] ${
          $theme === "dark" ? "text-slate-400" : "text-slate-600"
        }`}
      >
        No additional context blocks were attached.
      </p>
    {/if}
  </section>

  <hr
    class={`border-t ${
      $theme === "dark" ? "border-slate-700" : "border-slate-200"
    }`}
  />

  <!-- Output comparison grid -->
  <section class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <h3
        class={`text-xs font-semibold ${
          $theme === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Outputs (Compare Models)
      </h3>
      <p
        class={`text-[11px] ${
          $theme === "dark" ? "text-slate-400" : "text-slate-600"
        }`}
      >
        Score each output and mark the best one.
      </p>
    </div>

    <div class="grid gap-3 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
      {#each evaluation.outputs as output (output.id)}
        <article
          class={`rounded-md border p-3 flex flex-col gap-2 text-xs leading-relaxed transition-colors ${
            output.isWinner
              ? $theme === "dark"
                ? "border-amber-500/50 bg-amber-500/10"
                : "border-amber-400 bg-amber-50/50"
              : $theme === "dark"
              ? "bg-slate-950 border-slate-800"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <!-- Model header -->
          <header class="flex items-center justify-between gap-2">
            <div class="flex flex-col gap-0.5">
              <span
                class={`font-semibold text-[13px] ${
                  output.isWinner
                    ? $theme === "dark"
                      ? "text-amber-300"
                      : "text-amber-700"
                    : $theme === "dark"
                    ? "text-slate-100"
                    : "text-slate-900"
                }`}
              >
                {output.model}
              </span>
              {#if output.label}
                <span
                  class={`text-[10px] ${
                    $theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {output.label}
                </span>
              {/if}
            </div>
            {#if output.isWinner}
              <span
                class={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border font-medium ${
                  $theme === "dark"
                    ? "border-amber-500 text-amber-300 bg-amber-500/10"
                    : "border-amber-400 text-amber-700 bg-amber-50"
                }`}
              >
                ★ Preferred
              </span>
            {/if}
          </header>

          <!-- Output text in scrollable container -->
          <div
            class={`rounded-sm border text-[11px] leading-relaxed p-2 overflow-y-auto max-h-[260px] ${
              $theme === "dark"
                ? "border-slate-700 bg-slate-900 text-slate-100"
                : "border-slate-300 bg-white text-slate-900"
            }`}
          >
            {output.text}
          </div>

          <!-- Scoring and winner controls -->
          <div class="flex items-center justify-between gap-2 pt-1">
            <!-- Score buttons (1-5) -->
            <div class="flex items-center gap-1">
              <span
                class={`text-[10px] ${
                  $theme === "dark" ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Score:
              </span>
              <div class="flex gap-0.5">
                {#each [1, 2, 3, 4, 5] as value}
                  <button
                    type="button"
                    class={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center border font-medium transition-colors ${
                      output.score === value
                        ? "bg-amber-500 text-slate-900 border-amber-500"
                        : $theme === "dark"
                        ? "border-slate-600 text-slate-400 hover:bg-slate-800 hover:border-slate-500"
                        : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400"
                    }`}
                    title={`Score ${value}`}
                    onclick={() => setScore(output.id, value)}
                  >
                    {value}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Winner toggle button -->
            <button
              type="button"
              class={`text-[10px] font-medium transition-colors ${
                output.isWinner
                  ? $theme === "dark"
                    ? "text-amber-300 hover:text-amber-400"
                    : "text-amber-700 hover:text-amber-800"
                  : $theme === "dark"
                  ? "text-slate-400 hover:text-amber-400"
                  : "text-slate-600 hover:text-amber-600"
              }`}
              onclick={() => toggleWinner(output.id)}
              title={output.isWinner ? "Unset as winner" : "Mark as winner"}
            >
              {output.isWinner ? "★ Unset" : "☆ Winner"}
            </button>
          </div>
        </article>
      {/each}
    </div>
  </section>

  <hr
    class={`border-t ${
      $theme === "dark" ? "border-slate-700" : "border-slate-200"
    }`}
  />

  <!-- Evaluator notes -->
  <section class="flex flex-col gap-1.5">
    <h3
      class={`text-xs font-semibold ${
        $theme === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Evaluator Notes
    </h3>
    <textarea
      class={`w-full min-h-20 resize-y rounded-md border text-xs leading-relaxed p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
        $theme === "dark"
          ? "bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
          : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
      }`}
      placeholder="Summarize your evaluation, key differences between models, and any follow-up actions…"
      bind:value={localNotes}
      onchange={saveNotes}
    ></textarea>
  </section>

  <!-- Footer with actions -->
  <footer class="flex items-center justify-between gap-2 text-xs pt-2">
    <div class="flex gap-2">
      <button
        type="button"
        class="px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500 text-slate-900 hover:bg-amber-600 transition-colors"
      >
        Save Evaluation
      </button>
      <button
        type="button"
        class={`px-3 py-1.5 rounded-md border font-medium transition-colors ${
          $theme === "dark"
            ? "border-slate-600 text-slate-300 hover:bg-slate-800"
            : "border-slate-300 text-slate-600 hover:bg-slate-100"
        }`}
      >
        Export Summary
      </button>
    </div>
    <span
      class={`text-[11px] ${
        $theme === "dark" ? "text-slate-500" : "text-slate-500"
      }`}
    >
      ID: <span class="font-mono">{evaluation.id}</span>
    </span>
  </footer>
</section>
