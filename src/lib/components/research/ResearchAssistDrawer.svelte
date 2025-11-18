<!-- @component
### Props
- `! open` **boolean** = `false`
- `! workspace` **string** = `VibeForge Dev`
- `mode` **"workbench" | "quick-run"** = `workbench`
- `onClose` **() =► void**
- `onInsertSnippet` **(text: string) =► void**

no description yet
-->
<script lang="ts">
  import { theme } from "$lib/stores/themeStore";

  interface Props {
    open: boolean;
    workspace: string;
    mode?: "workbench" | "quick-run";
    onClose?: () => void;
    onInsertSnippet?: (text: string) => void;
  }

  let {
    open = false,
    workspace = "VibeForge Dev",
    mode = "workbench",
    onClose,
    onInsertSnippet,
  }: Props = $props();

  // Local state
  let activeTab = $state<"notes" | "snippets" | "suggestions">("notes");
  let notes = $state("");

  // Mocked snippets
  const snippets = $derived([
    {
      id: "snippet-1",
      title: "Code Review Boilerplate",
      category: "coding" as const,
      workspace: "VibeForge Dev",
      text: `Review this code for:
- Security vulnerabilities
- Performance bottlenecks
- Code style consistency
- Test coverage gaps
- Documentation clarity

Format your response as:
1. **Issues Found** – list each problem
2. **Risk Level** – high/medium/low
3. **Suggested Fixes** – concrete improvements
4. **Questions** – clarifications needed`,
      tags: ["code", "review", "boilerplate"],
      updatedAt: "2 days ago",
    },
    {
      id: "snippet-2",
      title: "Story Structure Checklist",
      category: "writing" as const,
      workspace: "AuthorForge",
      text: `Story Structure Verification:
- [ ] Clear protagonist with compelling motivation
- [ ] Inciting incident that disrupts status quo (within 10-15%)
- [ ] Clear goal/stakes the protagonist pursues
- [ ] Obstacles that escalate in difficulty
- [ ] Midpoint reversal or major reveal
- [ ] Crisis / all-is-lost moment
- [ ] Climax with clear resolution
- [ ] Denouement showing new status quo

Check pacing: does each beat land at expected story % mark?`,
      tags: ["story", "structure", "writing"],
      updatedAt: "1 week ago",
    },
    {
      id: "snippet-3",
      title: "LLM Safety Check",
      category: "analysis" as const,
      workspace: "Research Lab",
      text: `Before deploying, verify the output:\n1. Does it contain harmful instructions? (jailbreak detection)\n2. Are there unverified claims presented as facts?\n3. Does it leak sensitive information?\n4. Are there logical contradictions or hallucinations?\n5. Is the tone appropriate for the audience?\n6. Are citations provided where needed?\n\nSuggest rewrites for any fails.`,
      tags: ["safety", "verification", "llm"],
      updatedAt: "3 days ago",
    },
    {
      id: "snippet-4",
      title: "Analysis Framework",
      category: "analysis" as const,
      workspace: "Research Lab",
      text: `Analyze using this framework:
**Context** – What's the background/domain?
**Question** – What are we trying to understand?
**Key Factors** – What variables matter most?
**Trade-offs** – What's the cost-benefit?
**Uncertainties** – What do we not know?
**Next Steps** – How do we reduce uncertainty?`,
      tags: ["analysis", "framework", "research"],
      updatedAt: "today",
    },
  ]);

  // Mocked suggestions
  const suggestions = $derived([
    {
      id: "sug-1",
      title: "Separate Instructions from Content",
      category: "prompting" as const,
      body: 'Keep your system instructions distinct from the user content. Use clear markers or sections to separate "what to do" from "what to analyze". This helps the model distinguish between meta-instructions and the actual task.',
    },
    {
      id: "sug-2",
      title: "Be Explicit About Format",
      category: "structure" as const,
      body: 'Don\'t assume the model will guess your desired output format. Explicitly state: "Return as JSON", "Use markdown headers", "List items as bullet points". Include an example if the format is complex.',
    },
    {
      id: "sug-3",
      title: "Request Self-Checks & Verification",
      category: "safety" as const,
      body: 'Ask the model to double-check its own output: "Before concluding, verify that..." or "Check your answer against these criteria...". This often catches hallucinations and logical errors.',
    },
    {
      id: "sug-4",
      title: "Use Step-by-Step Reasoning",
      category: "structure" as const,
      body: 'When accuracy matters, prompt for reasoning: "Show your work step-by-step" or "Explain your logic before stating the conclusion". The chain-of-thought improves reliability.',
    },
    {
      id: "sug-5",
      title: 'Define "Good" Output',
      category: "prompting" as const,
      body: 'Be specific about quality criteria. Instead of "write good code", say "write code that is readable, efficient, and includes comments for complex logic".',
    },
    {
      id: "sug-6",
      title: "Test with Edge Cases",
      category: "evaluation" as const,
      body: "After crafting a prompt, run it with boundary cases or tricky inputs. Does it handle errors gracefully? Does it maintain quality on hard examples? Iterate from there.",
    },
  ]);

  function handleClose() {
    onClose?.();
  }

  function handleInsertSnippet(text: string) {
    onInsertSnippet?.(text);
  }
</script>

{#if open}
  <div class="fixed inset-0 z-40 flex justify-end">
    <!-- Backdrop -->
    <div
      class="flex-1 bg-black/40 cursor-pointer"
      onclick={handleClose}
      onkeydown={(e) => e.key === "Escape" && handleClose()}
      role="button"
      tabindex="0"
      aria-label="Close panel"
    />

    <!-- Panel -->
    <aside
      class={`w-full max-w-md h-full border-l flex flex-col transition-all ${
        $theme === "dark"
          ? "bg-slate-950 border-slate-800"
          : "bg-white border-slate-200"
      }`}
    >
      <!-- Header -->
      <header
        class={`flex items-center justify-between px-4 py-3 border-b ${
          $theme === "dark" ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div class="flex flex-col gap-0.5">
          <h2 class="text-sm font-semibold">Research & Assist</h2>
          <p
            class={`text-[11px] ${
              $theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Notes, snippets, and tips for this workspace.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span
            class={`text-[10px] ${
              $theme === "dark" ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {workspace}
          </span>
          <button
            class={`text-[11px] ${
              $theme === "dark"
                ? "text-slate-400 hover:text-slate-100"
                : "text-slate-500 hover:text-slate-900"
            }`}
            onclick={handleClose}
            type="button"
            aria-label="Close panel"
          >
            Close
          </button>
        </div>
      </header>

      <!-- Tabs -->
      <nav
        class={`px-4 pt-3 pb-2 flex gap-2 text-[11px] border-b ${
          $theme === "dark" ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <button
          class={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
            activeTab === "notes"
              ? "bg-amber-500 text-slate-900 border-amber-500"
              : $theme === "dark"
              ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          onclick={() => {
            activeTab = "notes";
          }}
          type="button"
        >
          Notes
        </button>
        <button
          class={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
            activeTab === "snippets"
              ? "bg-amber-500 text-slate-900 border-amber-500"
              : $theme === "dark"
              ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          onclick={() => {
            activeTab = "snippets";
          }}
          type="button"
        >
          Snippets
        </button>
        <button
          class={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
            activeTab === "suggestions"
              ? "bg-amber-500 text-slate-900 border-amber-500"
              : $theme === "dark"
              ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          onclick={() => {
            activeTab = "suggestions";
          }}
          type="button"
        >
          Suggestions
        </button>
      </nav>

      <!-- Content Area -->
      <div class={`flex-1 overflow-y-auto px-4 py-4 text-xs`}>
        {#if activeTab === "notes"}
          <!-- Notes Panel -->
          <section class="flex flex-col gap-2">
            <div>
              <h3 class="text-xs font-semibold mb-1">Workspace Notes</h3>
              <p
                class={`text-[11px] ${
                  $theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Keep rough research notes, links, and references here while you
                work.
              </p>
            </div>

            <textarea
              class={`w-full min-h-60 resize-y rounded-md border px-3 py-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                $theme === "dark"
                  ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400"
              }`}
              placeholder="Paste research notes, links, or key reference bullets…"
              bind:value={notes}
            />

            <p
              class={`text-[10px] ${
                $theme === "dark" ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Notes are stored locally for now. TODO: sync per workspace.
            </p>
          </section>
        {:else if activeTab === "snippets"}
          <!-- Snippets Panel -->
          <section class="flex flex-col gap-3">
            <div>
              <h3 class="text-xs font-semibold mb-1">Snippets</h3>
              <p
                class={`text-[11px] ${
                  $theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Reusable blocks you can insert into your prompt.
              </p>
            </div>

            <div class="flex flex-col gap-2">
              {#each snippets as snippet}
                <article
                  class={`rounded-md border p-3 flex flex-col gap-2 ${
                    $theme === "dark"
                      ? "bg-slate-900 border-slate-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 flex flex-col gap-0.5">
                      <span class="text-[12px] font-semibold"
                        >{snippet.title}</span
                      >
                      <span
                        class={`text-[10px] ${
                          $theme === "dark"
                            ? "text-slate-400"
                            : "text-slate-500"
                        }`}
                      >
                        {snippet.category} · {snippet.workspace}
                      </span>
                    </div>
                    <button
                      class="px-2 py-1 rounded-md text-[11px] font-medium bg-amber-500 text-slate-900 hover:bg-amber-600 whitespace-nowrap"
                      type="button"
                      onclick={() => handleInsertSnippet(snippet.text)}
                    >
                      Insert
                    </button>
                  </div>

                  {#if snippet.tags?.length}
                    <div class="flex flex-wrap gap-1 text-[10px]">
                      {#each snippet.tags as tag}
                        <span
                          class={`inline-flex items-center rounded-full border px-2 py-0.5 ${
                            $theme === "dark"
                              ? "bg-slate-800 border-slate-700 text-slate-300"
                              : "bg-slate-100 border-slate-300 text-slate-700"
                          }`}
                        >
                          {tag}
                        </span>
                      {/each}
                    </div>
                  {/if}

                  <div
                    class={`rounded-sm border px-2 py-1 text-[11px] leading-relaxed max-h-[120px] overflow-y-auto whitespace-pre-wrap text-left ${
                      $theme === "dark"
                        ? "bg-slate-950 border-slate-800 text-slate-200"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    {snippet.text}
                  </div>

                  <p
                    class={`text-[10px] ${
                      $theme === "dark" ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Updated {snippet.updatedAt}
                  </p>
                </article>
              {/each}
            </div>
          </section>
        {:else}
          <!-- Suggestions Panel -->
          <section class="flex flex-col gap-3">
            <div>
              <h3 class="text-xs font-semibold mb-1">Suggestions</h3>
              <p
                class={`text-[11px] ${
                  $theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Prompting tips and reminders to improve runs.
              </p>
            </div>

            <div class="flex flex-col gap-2">
              {#each suggestions as suggestion}
                <article
                  class={`rounded-md border p-3 flex flex-col gap-1.5 ${
                    $theme === "dark"
                      ? "bg-slate-900 border-slate-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div>
                    <h4 class="text-[12px] font-semibold">
                      {suggestion.title}
                    </h4>
                    <p
                      class={`text-[10px] ${
                        $theme === "dark" ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {suggestion.category}
                    </p>
                  </div>
                  <p
                    class={`text-[11px] leading-relaxed ${
                      $theme === "dark" ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    {suggestion.body}
                  </p>
                </article>
              {/each}
            </div>
          </section>
        {/if}
      </div>
    </aside>
  </div>
{/if}

<style lang="postcss">
  /* Smooth scroll behavior */
  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    @apply transparent;
  }

  ::-webkit-scrollbar-thumb {
    @apply rounded-full bg-slate-600;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-slate-500;
  }
</style>
