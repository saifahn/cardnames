<script lang="ts">
  import { wsConnect } from '$lib/gameState.svelte';
  import { onMount } from 'svelte';
  import '../app.css';
  let { children } = $props();

  let isLoading = $state(true);

  onMount(() => {
    wsConnect();
    isLoading = false;
  });
</script>

<main>
  <div class="container mx-auto">
    {#if isLoading}
      <p>Loading...</p>
    {:else}
      {@render children()}
    {/if}
  </div>
</main>
