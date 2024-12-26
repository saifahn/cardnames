<script lang="ts">
  import { getGameStateLoadedStatus, getWSConnectedStatus, wsConnect } from '$lib/gameState.svelte';
  import { onMount } from 'svelte';
  import '../app.css';
  import 'mana-font';
  let { children } = $props();

  let isLoaded = $derived(getWSConnectedStatus() && getGameStateLoadedStatus());

  onMount(() => {
    wsConnect();
  });
</script>

<main>
  <div class="container mx-auto px-2">
    {#if !isLoaded}
      <p>Connecting to server...</p>
    {:else}
      {@render children()}
    {/if}
  </div>
</main>
