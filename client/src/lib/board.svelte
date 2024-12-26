<script lang="ts">
  import { detailsHaveClue, type BoardSpace } from '../../../shared/types';
  import { textColorBasedOnIdentity } from './colors.svelte';
  import { gameState, guessCard } from './gameState.svelte';
  import TeamLogo from './teamLogo.svelte';
  let { spymasterView = false } = $props();

  const showGuessCardButton = $derived(detailsHaveClue(gameState.game?.details) && !spymasterView);

  function textColorBasedOnCard(card: BoardSpace) {
    if (card.flipped) {
      return textColorBasedOnIdentity(card.identity);
    }
  }

  function borderBasedOnCard(card: BoardSpace) {
    if (card.flipped) {
      if (card.identity === 'emrakul') return 'border-indigo-700 dark:border-indigo-500 border-2';
      if (card.identity === 'neutral') return 'border-stone-500 border-2';
      if (card.identity === 'mirran') return 'border-sky-500 border-2';
      if (card.identity === 'phyrexian') return 'border-rose-500 border-2';
    }
    return 'border-slate-200';
  }
</script>

<div class="mt-4 grid grid-cols-3 gap-1 md:grid-cols-5">
  {#each gameState.game!.board as row, rowIndex}
    {#each row as card, colIndex}
      <div
        class="min-h-36 rounded-xl border p-3 shadow-md dark:border-slate-700 {borderBasedOnCard(
          card
        )} flex flex-col items-center justify-center"
      >
        <h4 class="mb-2 font-semibold {textColorBasedOnCard(card)} text-center">{card.word}</h4>
        {#if gameState.game?.details.status === 'gameOverEmrakul' || gameState.game?.details.status === 'gameOverOperatives' || card.flipped || spymasterView}
          <span class="flex justify-center {textColorBasedOnCard(card)}">
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
