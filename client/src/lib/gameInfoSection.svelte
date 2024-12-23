<script lang="ts">
  import { gameState } from './gameState.svelte';
  import TeamLogo from './teamLogo.svelte';
</script>

<section>
  {#if gameState.game === null}
    <p>Something went wrong - you shouldn't be here</p>
  {:else}
    <div class="border p-4">
      {#if gameState.game.details?.status === 'gameOverAssassin'}
        <h3 class="text-lg">
          {gameState.game.details.team} has chosen the assassin and lost the game
        </h3>
      {:else if gameState.game.details?.status === 'gameOverOperatives'}
        <h3 class="text-lg">
          {gameState.game.details.team} have found all of their cards and won the game
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
  {/if}
</section>
