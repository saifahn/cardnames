<script lang="ts">
  import { gameState, startGame } from './gameState.svelte';
  import TeamLogo from './teamLogo.svelte';
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
      <span class="block w-20">
        <TeamLogo team={gameState.game!.goesFirst} /> will go first and have 9 cards to find.
      </span>
    </div>
    <div class="border p-4">
      <span class="block w-20">
        <TeamLogo team={gameState.game!.goesFirst === 'mirran' ? 'phyrexian' : 'mirran'} /> will go second
        and have 8 cards to find.
      </span>
    </div>
  </div>
  <div class="mb-3">
    <ol>
      <li>Decide your teams</li>
      <li>Decide your spymasters</li>
      <a href="/game/spymaster">Spymasters click here this link</a>
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
