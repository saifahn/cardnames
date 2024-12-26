<script lang="ts">
  import { getOpposingTeam } from '../../../shared/getOpposingTeam';
  import { detailsHaveClue, type CardIdentity } from '../../../shared/types';
  import { textColorBasedOnIdentity } from './colors.svelte';
  import { createNewGame, gameState, passTurn } from './gameState.svelte';
  import InlineTeamLogo from './inlineTeamLogo.svelte';
  import TeamLogo from './teamLogo.svelte';

  const waitingForClueText = 'Waiting for the spymaster to give a clue.';

  const { spymasterView = false } = $props();

  function stylesIfCurrentTurn(identity: CardIdentity) {
    if (gameState.game?.currentTurn === identity) return textColorBasedOnIdentity(identity);
  }
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

      <div class="flex flex-grow flex-col items-center justify-center gap-2 p-1">
        {#if gameState.game.details.status === 'gameStarted'}
          <p>
            The game has started. It is now the <InlineTeamLogo
              identity={gameState.game.currentTurn}
            />
            turn.
          </p>
          <p>
            {waitingForClueText}
          </p>
        {:else if gameState.game.details.status === 'clueGiven'}
          <p>
            The <InlineTeamLogo identity={gameState.game.currentTurn} /> spymaster has given the clue:
          </p>
        {:else if gameState.game.details.status === 'correctGuess'}
          <p>
            The <InlineTeamLogo identity={gameState.game.currentTurn} /> team successfully contacted
            one of their agents.
          </p>
          <p>
            They have {gameState.game.details.clue.number === '0' ||
            gameState.game.details.clue.number === '∞'
              ? 'unlimited'
              : gameState.game.details.guessesRemaining} guesses remaining.
          </p>
        {:else if gameState.game.details.status === 'correctGuessLimitReached'}
          <p>
            The <InlineTeamLogo identity={gameState.game.details.team} /> team successfully contacted
            one of their agents.
          </p>
          <p>They have used all of their guesses for this turn.</p>
          <p>It is now the <InlineTeamLogo identity={gameState.game.currentTurn} /> turn</p>
        {:else if gameState.game.details.status === 'incorrectGuess'}
          <p>
            The <InlineTeamLogo identity={gameState.game.details.team} /> team incorrectly picked a <InlineTeamLogo
              identity={gameState.game.details.identityPicked}
            /> card.
          </p>
          <p>It is now the <InlineTeamLogo identity={gameState.game.currentTurn} /> turn.</p>
          <p>{waitingForClueText}</p>
        {:else if gameState.game.details.status === 'turnPassed'}
          <p>
            The <InlineTeamLogo identity={gameState.game.details.team} /> team has passed the turn.
          </p>
          <p>It is now the <InlineTeamLogo identity={gameState.game.currentTurn} /> turn.</p>
          <p>{waitingForClueText}</p>
        {:else if gameState.game.details.status === 'gameOverEmrakul'}
          <p>
            The <InlineTeamLogo identity={gameState.game.details.team} /> team has been led to Emrakul.
          </p>
          <p>
            The <InlineTeamLogo identity={getOpposingTeam(gameState.game.details.team)} /> has won the
            game!
          </p>
        {:else if gameState.game.details.status === 'gameOverOperatives'}
          <p>
            All of the <InlineTeamLogo identity={gameState.game.details.team} /> cards have been chosen.
            They win the game!
          </p>
        {/if}

        {#if detailsHaveClue(gameState.game.details) && !spymasterView}
          <p class="text-xl font-medium">
            {gameState.game.details.clue.word}
            {gameState.game.details.clue.number}
          </p>
          <button
            class="rounded border px-4 py-2 hover:border-slate-500 active:border-slate-400 active:text-slate-400"
            onclick={passTurn}
          >
            Pass turn
          </button>
        {/if}

        {#if gameState.game.details.status === 'gameOverOperatives' || gameState.game.details.status === 'gameOverEmrakul'}
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
