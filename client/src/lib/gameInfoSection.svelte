<script lang="ts">
  import { createNewGame, gameState } from './gameState.svelte';
  import TeamLogo from './teamLogo.svelte';

  const waitingForClueText = 'Waiting for the spymaster to give a clue.';

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

<section class="flex gap-2">
  {#if gameState.game === null}
    <p>Something went wrong - you shouldn't be here</p>
  {:else}
    <div class="border p-4">
      <h3 class="text-lg">
        {detailsText}
      </h3>
      {#if gameState.game.details.status === 'gameOverOperatives' || gameState.game.details.status === 'gameOverAssassin'}
        <button
          class="rounded border border-rose-600 px-4 py-2 text-rose-300 hover:border-rose-700 hover:text-rose-400 active:border-rose-500"
          onclick={createNewGame}
        >
          Reset and create new game
        </button>
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
  {/if}
</section>
