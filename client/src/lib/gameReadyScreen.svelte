<script lang="ts">
  import { gameState, startGame } from './gameState.svelte';
  import TeamLogo from './teamLogo.svelte';

  const { spymasterView = false } = $props();
</script>

<div>
  <div class="mb-4 flex items-center gap-2 bg-slate-200 p-4 dark:bg-slate-700">
    <p class="flex-grow">
      There is a game waiting to be started. Make sure you're ready, then press the start game
      button.
    </p>
  </div>
  <div class="mb-3 flex gap-4">
    <div class="border p-4">
      <span class="flex w-20">
        <TeamLogo team={gameState.game!.currentTurn} />
      </span>
      will go first and have 9 cards to find.
    </div>
    <div class="border p-4">
      <span class="flex w-20">
        <TeamLogo team={gameState.game!.currentTurn === 'mirran' ? 'phyrexian' : 'mirran'} />
      </span>
      will go second and have 8 cards to find.
    </div>
    <div class="border p-4">
      <h3>Your current role:</h3>
      <p class="text-xl font-semibold">{spymasterView ? 'Spymaster' : 'Operative'}</p>
    </div>
  </div>
  <div class="mb-3">
    <ol class="list-inside list-decimal">
      <li>Decide your teams</li>
      <li>Decide your spymasters</li>
      <ul class="list-inside list-disc pl-6">
        {#if spymasterView}
          <li>
            If you will stop being the spymaster for your team, press <a
              href="/game"
              class="text-indigo-500 underline dark:text-indigo-300">this operative link</a
            >
          </li>
        {:else}
          <li>
            If you are the spymaster for your team, press <a
              href="/game/spymaster"
              class="text-indigo-500 underline dark:text-indigo-300">this spymaster link</a
            >
          </li>
        {/if}
      </ul>
    </ol>
  </div>
  <div>
    <button
      onclick={startGame}
      class="rounded-md bg-sky-200 px-4 py-2 hover:bg-sky-300 active:bg-sky-100 dark:bg-sky-700 dark:hover:bg-sky-800 dark:active:bg-sky-600"
    >
      Start game
    </button>
  </div>
</div>
