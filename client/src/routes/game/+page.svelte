<script lang="ts">
  import Board from '$lib/board.svelte';
  import GameInfoSection from '$lib/gameInfoSection.svelte';
  import GameReadyScreen from '$lib/gameReadyScreen.svelte';
  import { gameState } from '$lib/gameState.svelte';
</script>

{#if gameState.game === null}
  <p>Something went wrong - you shouldn't be here</p>
  <a href="/" class="mt-2 text-indigo-500 underline dark:text-indigo-300">Go to the home page</a>
{:else if gameState.game.details.status === 'gameReady'}
  <GameReadyScreen />
{:else}
  <GameInfoSection />
  <Board />
{/if}
