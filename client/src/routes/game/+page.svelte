<script lang="ts">
  import Board from '$lib/board.svelte';
  import GameInfoSection from '$lib/gameInfoSection.svelte';
  import GameReadyScreen from '$lib/gameReadyScreen.svelte';
  import { gameState, passTurn } from '$lib/gameState.svelte';
  import { detailsHaveClue } from '../../../../shared/types';
</script>

{#if gameState.game === null}
  <p>Something went wrong - you shouldn't be here</p>
{:else if gameState.game.details.status === 'gameReady'}
  <GameReadyScreen />
{:else}
  <div class="mb-4">
    <GameInfoSection />
  </div>
  <Board />
{/if}
