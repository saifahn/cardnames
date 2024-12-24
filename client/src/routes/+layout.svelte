<script lang="ts">
  import { gameState, wsConnect } from '$lib/gameState.svelte';
  import { onMount } from 'svelte';
  import '../app.css';
  let { children } = $props();

  let isConnected = $state(false);
  let isLoaded = $derived(isConnected && gameState);

  onMount(() => {
    wsConnect();
    isConnected = true;
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
