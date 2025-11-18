<script lang="ts">
  import '../app.css';
  import ForgeTopBar from '$lib/components/ForgeTopBar.svelte';
  import ForgeSideNav from '$lib/components/ForgeSideNav.svelte';
  import WorkbenchShell from '$lib/components/WorkbenchShell.svelte';
</script>

<div class="min-h-screen bg-forge-blacksteel text-forge-textBright flex flex-col">
  <ForgeTopBar />
  <div class="flex flex-1 overflow-hidden">
    <ForgeSideNav />
    <WorkbenchShell>
      <slot />
    </WorkbenchShell>
  </div>
</div>
