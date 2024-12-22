<script lang="ts">
  import Board from '$lib/board.svelte';
  import GameReadyScreen from '$lib/gameReadyScreen.svelte';
  import { gameState, submitClue } from '$lib/gameState.svelte';
  import TeamLogo from '$lib/teamLogo.svelte';

  const NUMBER_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '∞'] as const;

  let clueBeingInput = $state('');
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
  <GameReadyScreen />
{:else}
  <div class="mb-3 flex gap-4">
    <div class="border p-4">
      {#if gameState.game.lastAction === 'assassinChosen'}
        <h3 class="text-lg">
          {gameState.game.currentTurn} has chosen the assassin and lost the game
        </h3>
      {:else if gameState.game.lastAction === 'allOperativesFound'}
        <h3 class="text-lg">
          {gameState.game.currentTurn} have found all of their cards and won the game
        </h3>
      {:else}
        <h3 class="text-lg">Current turn:</h3>
        <TeamLogo team={gameState.game.currentTurn} />
      {/if}
    </div>
    <div class="border p-4">
      <TeamLogo team="mirran" />
      <p>{gameState.game.cardsRemaining.mirran} cards to find</p>
    </div>
    <div class="border p-4">
      <TeamLogo team="phyrexian" />
      <p>{gameState.game.cardsRemaining.phyrexian} cards to find</p>
    </div>
    <div class="border p-4">
      {#if !gameState.game.clue.word}
        <h3 class="text-lg">Waiting for your clue</h3>
        <form class="mt-2" onsubmit={handleSubmit}>
          <input
            type="text"
            class="rounded-lg border border-slate-200 bg-transparent p-2"
            placeholder="Enter your clue"
            bind:value={clueBeingInput}
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
