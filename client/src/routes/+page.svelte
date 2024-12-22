<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState, wsConnect, createNewGame } from '$lib/gameState.svelte';
  import GameReadyScreen from '$lib/gameReadyScreen.svelte';
  import WelcomeScreen from '$lib/welcomeScreen.svelte';
  import GameInProgress from '$lib/gameInProgress.svelte';

  let isLoading = $state(true);
  let isOnWelcomeScreen = $state(true);

  onMount(() => {
    wsConnect();
    isLoading = false;
  });

  function handleStartGameFromWelcome() {
    createNewGame();
    isOnWelcomeScreen = false;
  }

  function handleJoinGame() {
    isOnWelcomeScreen = false;
  }
</script>

{#if isLoading}
  <p>Loading...</p>
{:else if isOnWelcomeScreen || gameState.game === null}
  <WelcomeScreen startNewGame={handleStartGameFromWelcome} enterGame={handleJoinGame} />
{:else if gameState.game.status === 'ready'}
  <GameReadyScreen />
{:else}
  <GameInProgress />
{/if}
