<script lang="ts">
  import { gameState, guessCard } from './gameState.svelte';
  import TeamLogo from './teamLogo.svelte';
  let { spymasterView = false } = $props();

  const showGuessCardButton = $derived(
    gameState.game?.status === 'inProgress' && gameState.game?.clue.word && !spymasterView
  );
</script>

<div class="grid grid-cols-5 gap-2">
  {#each gameState.game!.board as row, rowIndex}
    {#each row as card, colIndex}
      <div class="rounded-lg border border-slate-200 p-8 hover:border-slate-400">
        <h4 class="mb-2 font-semibold">{card.word}</h4>
        {#if card.flipped || spymasterView}
          <span class="flex w-12">
            <TeamLogo team={card.identity} />
          </span>
        {/if}
        {#if showGuessCardButton && !card.flipped}
          <button
            class="mt-2 rounded border px-4 py-2 hover:border-slate-500 active:border-slate-400 active:text-slate-400"
            onclick={() => guessCard([rowIndex, colIndex], card.word)}
          >
            Guess card
          </button>
        {/if}
      </div>
    {/each}
  {/each}
</div>
