<script lang="ts">
  import { gameState, startGame } from './gameState.svelte';
  import { textColorBasedOnIdentity } from '$lib/colors.svelte';
  import { getOpposingTeam } from '../../../shared/getOpposingTeam';
  import TeamLogo from './teamLogo.svelte';
  import InlineTeamLogo from './inlineTeamLogo.svelte';

  const { spymasterView = false } = $props();
</script>

<h1 class="mb-3 text-2xl font-bold">Cardnames overview</h1>
<div class="mb-8 rounded-md border p-4">
  <ul class="list-inside list-disc space-y-1.5">
    <li>
      <a
        href="https://czechgames.com/en/codenames/downloads/"
        class="text-indigo-500 underline dark:text-indigo-300">Codenames</a
      > but with Magic: the Gathering cards.
    </li>
    <li>
      The <InlineTeamLogo team={'mirran'} />
      spymaster will be racing against the
      <InlineTeamLogo team={'phyrexian'} />
      spymaster to be the first to get their operatives in contact with their respective agents.
    </li>
    <li>
      If a spymaster leads their operatives to <span
        class="inline-flex items-baseline gap-1 font-semibold text-indigo-700 dark:text-indigo-500"
        ><i class="ms ms-dfc-emrakul"></i> Emrakul</span
      >, their team loses.
    </li>
    <li>
      <span class="inline-flex items-baseline gap-1 font-semibold text-stone-500"
        ><i class="ms ms-token"></i> Neutral</span
      > squirrel tokens will slow a team down, but are otherwise harmless.
    </li>
    <li>
      One idea for a house rule: as an exception to the rule that clues must be one word, you can
      give the whole name of a Magic card not on the board as a clue.
    </li>
    <li>
      Currently, the cards used for the game are taken from a Vintage Cube list in November 2024.
    </li>
  </ul>
</div>

<h2 class="mb-4 text-xl font-semibold">1. Decide the teams</h2>
<div class="mb-4 flex flex-wrap items-center gap-1 px-2">
  <span class="flex items-center gap-2 {textColorBasedOnIdentity(gameState.game!.currentTurn)}">
    <h3 class="text-lg font-medium">
      The
      <span class="px-0.5"><TeamLogo team={gameState.game!.currentTurn} /></span>
      <span class="capitalize">{gameState.game!.currentTurn}</span> team
    </h3>
  </span>
  <p>will go first and have 9 agents to find.</p>
</div>
<div class="mb-8 flex flex-wrap items-center gap-1 px-2">
  <span
    class="flex items-center gap-2 {textColorBasedOnIdentity(
      getOpposingTeam(gameState.game!.currentTurn)
    )}"
  >
    <h3 class="text-lg font-medium">
      The <span class="px-0.5"
        ><TeamLogo team={getOpposingTeam(gameState.game!.currentTurn)} /></span
      >
      <span class="capitalize">
        {getOpposingTeam(gameState.game!.currentTurn)}
      </span> team
    </h3>
  </span>
  <p>will go second and have 8 agents to find.</p>
</div>

<h2 class="mb-3 text-xl font-semibold">2. Decide the spymasters</h2>
<div class="mb-6">
  <p class="mb-2 flex items-baseline gap-1">
    You are currently
    <span class="text-lg font-medium text-indigo-500 dark:text-indigo-300"
      >{spymasterView ? 'a Spymaster' : 'an Operative'}</span
    >
  </p>
  {#if spymasterView}
    <p>
      If you will play as an operative this round, <a
        href="/game"
        class="text-indigo-500 underline dark:text-indigo-300">become an operative</a
      >
    </p>
  {:else}
    <p>
      If you will play as the spymaster for your team this round, <a
        href="/game/spymaster"
        class="text-indigo-500 underline dark:text-indigo-300">become a spymaster</a
      >
    </p>
  {/if}
</div>

<div>
  <button
    class="rounded-md bg-indigo-100 px-4 py-2 hover:bg-indigo-200 active:bg-indigo-50 dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:active:bg-indigo-600"
    onclick={startGame}
  >
    Start game
  </button>
</div>
