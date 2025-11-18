<!-- @component
### Props
- `children` **Snippet**

no description yet
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<main class="flex-1 flex flex-col bg-forge-blacksteel">
  {#if children}
    {@render children()}
  {/if}
</main>
