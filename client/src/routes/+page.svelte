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

<h1 class="mb-2 text-3xl font-bold">Welcome to Cardnames!</h1>
{#if gameState.game === null || gameState.game.details.status === 'gameOverOperatives' || gameState.game.details.status === 'gameOverAssassin'}
  <p class="mb-4 flex-grow">
    There is no game currently in progress. Would you like to create a new game?
  </p>
  <button
    class="rounded-md bg-indigo-100 px-4 py-2 hover:bg-indigo-200 active:bg-indigo-50 dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:active:bg-indigo-600"
    onclick={createNewGameAndEnter}
  >
    Create game
  </button>
{:else if gameState.game.details.status === 'gameReady'}
  <p class="mb-4 flex-grow">
    There is a game waiting to be started. Click the button below to start and join the game.
  </p>
  <button
    class="rounded-md bg-indigo-100 px-4 py-2 hover:bg-indigo-200 active:bg-indigo-50 dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:active:bg-indigo-600"
    onclick={enterGame}
  >
    Join game
  </button>
{:else}
  <p class="mb-4 flex-grow">
    There is a game in progress. Click the button below to join the game.
  </p>
  <button
    class="rounded-md bg-indigo-100 px-4 py-2 hover:bg-indigo-200 active:bg-indigo-50 dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:active:bg-indigo-600"
    onclick={enterGame}
  >
    Join game
  </button>
{/if}
