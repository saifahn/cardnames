<script lang="ts">
  import { detailsHaveClue, type BoardSpace, type CardIdentity } from '../../../shared/types';
  import { gameState, guessCard } from './gameState.svelte';
  import TeamLogo from './teamLogo.svelte';
  let { spymasterView = false } = $props();

  const showGuessCardButton = $derived(detailsHaveClue(gameState.game?.details) && !spymasterView);

  function textColorBasedOnCard(card: BoardSpace) {
    if (card.flipped) {
      if (card.identity === 'assassin') return 'text-slate-900';
      if (card.identity === 'neutral') return 'text-stone-500';
      if (card.identity === 'mirran') return 'text-sky-500';
      if (card.identity === 'phyrexian') return 'text-rose-500';
    }
  }

  function borderBasedOnCard(card: BoardSpace) {
    if (card.flipped) {
      if (card.identity === 'assassin') return 'border-slate-900 border-2';
      if (card.identity === 'neutral') return 'border-stone-500 border-2';
      if (card.identity === 'mirran') return 'border-sky-500 border-2';
      if (card.identity === 'phyrexian') return 'border-rose-500 border-2';
    }
    return 'border-slate-200';
  }
</script>

<div class="grid grid-cols-3 gap-2 md:grid-cols-5">
  {#each gameState.game!.board as row, rowIndex}
    {#each row as card, colIndex}
      <div class="rounded-lg border p-4 {borderBasedOnCard(card)}">
        <h4 class="mb-2 font-semibold {textColorBasedOnCard(card)} text-center">{card.word}</h4>
        {#if card.flipped || spymasterView}
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
