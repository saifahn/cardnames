<script lang="ts">
  import { gameState, createNewGame } from '$lib/gameState.svelte';
  import { goto } from '$app/navigation';

  async function enterGame() {
    try {
      await goto('/game');
    } catch (err) {
      let error = '';
      if (typeof err === 'string') {
        error = err;
      }
      throw new Error(error);
    }
  }

  async function createNewGameAndEnter() {
    createNewGame();
    await enterGame();
  }
</script>

<h1 class="text-3xl font-bold">Welcome to Cardnames!</h1>
{#if gameState.game === null || gameState.game.details.status === 'gameOverOperatives' || gameState.game.details.status === 'gameOverAssassin'}
  <div class="mb-4 flex items-center gap-2 bg-slate-200 p-4 dark:bg-slate-700">
    <p class="flex-grow">
      There is no game currently in progress. Would you like to create a new game?
    </p>
    <button
      class="rounded-md bg-sky-200 px-4 py-2 hover:bg-sky-300 active:bg-sky-100 dark:bg-sky-700 dark:hover:bg-sky-800 dark:active:bg-sky-600"
      onclick={createNewGameAndEnter}
    >
      Create game
    </button>
  </div>
{:else if gameState.game.details.status === 'gameReady'}
  <p class="flex-grow">
    There is a game waiting to be started. Click the button below to start and join the game.
  </p>
  <button
    class="rounded-md bg-sky-200 px-4 py-2 hover:bg-sky-300 active:bg-sky-100 dark:bg-sky-700 dark:hover:bg-sky-800 dark:active:bg-sky-600"
    onclick={enterGame}
  >
    Join game
  </button>
{:else}
  <p class="flex-grow">There is a game in progress. Click the button below to join the game.</p>
  <button
    class="rounded-md bg-sky-200 px-4 py-2 hover:bg-sky-300 active:bg-sky-100 dark:bg-sky-700 dark:hover:bg-sky-800 dark:active:bg-sky-600"
    onclick={enterGame}
  >
    Join game
  </button>
{/if}
