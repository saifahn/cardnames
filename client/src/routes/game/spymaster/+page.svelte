<script lang="ts">
  import Board from '$lib/board.svelte';
  import GameInfoSection from '$lib/gameInfoSection.svelte';
  import GameReadyScreen from '$lib/gameReadyScreen.svelte';
  import { gameState, submitClue } from '$lib/gameState.svelte';

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
{:else if gameState.game.status === 'ready'}
  <GameReadyScreen spymasterView={true} />
{:else}
  <div class="mb-3 flex gap-4">
    <GameInfoSection />
    <div class="border p-4">
      {#if !gameState.game.clue.word}
        <h3 class="text-lg">Waiting for your clue</h3>
        <form class="mt-2" onsubmit={handleSubmit}>
          <input
            type="text"
            class="rounded-lg border border-slate-200 bg-transparent p-2"
            placeholder="Enter your clue"
            bind:value={() => clueBeingInput, upperCaseSetClue}
          />
          <select
            class="focus:shadow-outline inline appearance-none rounded-lg border border-slate-200 bg-transparent px-4 py-2 pr-8 hover:border-slate-300 focus:outline-none"
            bind:value={selectedNumber}
          >
            {#each NUMBER_OPTIONS as number}
              <option>{number}</option>
            {/each}
          </select>
          <button
            class="mt-2 rounded border px-4 py-2 hover:border-slate-500 active:border-slate-400 active:text-slate-400"
          >
            Submit
          </button>
        </form>
      {:else}
        <h3>Current clue:</h3>
        <p class="text-lg capitalize">{gameState.game.clue.word} {gameState.game.clue.number}</p>
      {/if}
    </div>
  </div>
  <Board spymasterView={true} />
{/if}
