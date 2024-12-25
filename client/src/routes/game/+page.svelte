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
  <div class="mb-3 flex gap-4">
    <GameInfoSection />
    <div class="border p-4">
      {#if detailsHaveClue(gameState.game.details)}
        <h3>Current clue:</h3>
        <p class="text-lg capitalize">
          {gameState.game.details.clue.word}
          {gameState.game.details.clue.number}
        </p>
        <button
          class="mt-2 rounded border px-4 py-2 hover:border-slate-500 active:border-slate-400 active:text-slate-400"
          onclick={passTurn}
        >
          Pass turn
        </button>
      {:else}
        <h3 class="text-lg">Waiting for clue</h3>
      {/if}
    </div>
  </div>
  <Board />
{/if}
