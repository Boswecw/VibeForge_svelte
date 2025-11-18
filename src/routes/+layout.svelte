<script lang="ts">
  import '../app.css';
  import ForgeTopBar from '$lib/components/ForgeTopBar.svelte';
  import ForgeSideNav from '$lib/components/ForgeSideNav.svelte';
  import WorkbenchShell from '$lib/components/WorkbenchShell.svelte';
  import { theme } from '$lib/stores/themeStore';
</script>

<!-- Theme-aware root layout with smooth transitions -->
<div class={`min-h-screen flex flex-col transition-colors ${
  $theme === 'dark'
    ? 'bg-slate-950 text-slate-100'
    : 'bg-slate-50 text-slate-900'
}`}>
  <ForgeTopBar />
  <div class="flex flex-1 overflow-hidden">
    <ForgeSideNav />
    <WorkbenchShell>
      <slot />
    </WorkbenchShell>
  </div>
</div>
