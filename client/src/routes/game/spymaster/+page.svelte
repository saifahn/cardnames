<script lang="ts">
  import Board from '$lib/board.svelte';
  import GameInfoSection from '$lib/gameInfoSection.svelte';
  import GameReadyScreen from '$lib/gameReadyScreen.svelte';
  import { gameState, isWaitingForClue, submitClue } from '$lib/gameState.svelte';

  const NUMBER_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '∞'] as const;

  let clueBeingInput = $state('');
  function upperCaseSetClue(clue: string) {
    clueBeingInput = clue.toUpperCase();
  }
  let selectedNumber: (typeof NUMBER_OPTIONS)[number] = $state('0');

  function handleSubmit(e: Event) {
    e.preventDefault();
    submitClue(clueBeingInput, selectedNumber);
    selectedNumber = '0';
    clueBeingInput = '';
  }
</script>

{#if gameState.game === null}
  <p>Something went wrong - you shouldn't be here</p>
  <a href="/" class="mt-2 text-indigo-500 underline dark:text-indigo-300">Go to the home page</a>
{:else if gameState.game.details.status === 'gameReady'}
  <GameReadyScreen spymasterView={true} />
{:else}
  <GameInfoSection spymasterView={true} />
  {#if isWaitingForClue(gameState.game.details)}
    <div
      class="mt-2 rounded-lg border border-slate-200 p-4 shadow-sm dark:border-slate-700 dark:shadow-lg"
    >
      <h3 class="text-lg">Waiting for your one word clue and number of associated cards</h3>
      <form class="mt-2" onsubmit={handleSubmit}>
        <input
          type="text"
          class="rounded-lg border border-slate-300 bg-transparent p-2 hover:border-slate-500 dark:border-slate-600"
          placeholder="Enter your clue"
          bind:value={() => clueBeingInput, upperCaseSetClue}
        />
        <select
          class="focus:shadow-outline inline appearance-none rounded-lg border border-slate-300 bg-transparent px-4 py-2 pr-8 hover:border-slate-500 focus:outline-none dark:border-slate-600"
          bind:value={selectedNumber}
        >
          {#each NUMBER_OPTIONS as number}
            <option>{number}</option>
          {/each}
        </select>
        <button
          class="mt-2 rounded border px-4 py-2 hover:border-slate-500 active:border-slate-400 active:text-slate-400 dark:border-slate-600"
        >
          Submit
        </button>
      </form>
    </div>
  {/if}
  <Board spymasterView={true} />
{/if}
