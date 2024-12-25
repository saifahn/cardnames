<script lang="ts">
  import { getWSConnected, wsConnect } from '$lib/gameState.svelte';
  import { onMount } from 'svelte';
  import '../app.css';
  let { children } = $props();

  let isLoaded = $derived(getWSConnected());

  onMount(() => {
    wsConnect();
  });
</script>

<main>
  <div class="container mx-auto">
    {#if !isLoaded}
      <p>Connecting to server...</p>
    {:else}
      {@render children()}
    {/if}
  </div>
</main>
