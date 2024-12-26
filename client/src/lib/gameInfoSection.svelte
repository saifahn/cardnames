<script lang="ts">
  import { detailsHaveClue, type CardIdentity } from '../../../shared/types';
  import { textColorBasedOnIdentity } from './colors.svelte';
  import { createNewGame, gameState, passTurn } from './gameState.svelte';
  import TeamLogo from './teamLogo.svelte';

  const waitingForClueText = 'Waiting for the spymaster to give a clue.';

  const { spymasterView = false } = $props();

  function stylesIfCurrentTurn(identity: CardIdentity) {
    if (gameState.game?.currentTurn === identity) return textColorBasedOnIdentity(identity);
  }

  const detailsText = $derived.by(() => {
    if (!gameState.game) {
      return "There's no game and no details text to display.";
    }
    const gameDetails = gameState.game.details;

    switch (gameDetails.status) {
      case 'gameStarted':
        return `The game has started. It is now the ${gameState.game.currentTurn}'s turn. ${waitingForClueText}`;
      case 'clueGiven':
        return `Clue given by the ${gameDetails.team} spymaster: ${gameDetails.clue.word} ${gameDetails.clue.number}`;
      case 'correctGuess':
        return `Correct guess by the ${gameDetails.team} team. You have ${gameDetails.guessesRemaining > 10 ? 'unlimited' : gameDetails.guessesRemaining} guesses remaining.`;
      case 'correctGuessLimitReached':
        return `Correct guess by the ${gameDetails.team} team. You have used all of your guesses for this turn. It is now the ${gameState.game.currentTurn}'s turn.`;
      case 'incorrectGuess':
        return `Incorrect guess by the ${gameDetails.team} team. They picked a card with the ${gameDetails.identityPicked} identity. It is now the ${gameState.game.currentTurn}'s turn. ${waitingForClueText}`;
      case 'turnPassed':
        return `The ${gameDetails.team} team has passed their turn. It is now the ${gameState.game.currentTurn}'s turn. ${waitingForClueText}`;
      case 'gameOverAssassin':
        return `${gameDetails.team} has chosen the assassin and lost the game`;
      case 'gameOverOperatives':
        return `${gameDetails.team} have found all of their cards and won the game!`;
      default:
        return `Current turn: ${gameState.game.currentTurn}`;
    }
  });
</script>

<section class="rounded-lg border p-3 shadow-lg dark:border-slate-700">
  {#if gameState.game === null}
    <p>Something went wrong - you shouldn't be here</p>
  {:else}
    <div class="flex gap-2">
      <div class="flex flex-col items-center gap-2 p-4 {stylesIfCurrentTurn('mirran')}">
        <TeamLogo team="mirran" />
        <p class="text-xl font-semibold">{gameState.game.cardsRemaining.mirran}</p>
      </div>
      <div class="mb-2 p-4">
        <h3 class="text-lg">
          {detailsText}
        </h3>
        {#if detailsHaveClue(gameState.game.details) && !spymasterView}
          <button
            class="mt-2 rounded border px-4 py-2 hover:border-slate-500 active:border-slate-400 active:text-slate-400"
            onclick={passTurn}
          >
            Pass turn
          </button>
        {/if}
        {#if gameState.game.details.status === 'gameOverOperatives' || gameState.game.details.status === 'gameOverAssassin'}
          <button
            class="rounded border border-rose-600 px-4 py-2 text-rose-500 hover:border-rose-700 hover:text-rose-600 active:border-rose-300 active:text-rose-200 dark:text-rose-300 dark:hover:text-rose-400"
            onclick={createNewGame}
          >
            Reset and create new game
          </button>
        {/if}
      </div>
      <div class="flex flex-col items-center gap-2 p-4 {stylesIfCurrentTurn('phyrexian')}">
        <TeamLogo team="phyrexian" />
        <p class="text-xl font-semibold">{gameState.game.cardsRemaining.phyrexian}</p>
      </div>
    </div>
  {/if}
</section>
