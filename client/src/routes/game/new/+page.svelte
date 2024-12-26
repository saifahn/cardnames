<script lang="ts">
  import { createNewGame } from '$lib/gameState.svelte';
</script>

<div class="mt-4 flex gap-2">
  <button
    class="rounded border border-rose-600 px-4 py-2 text-rose-500 hover:border-rose-700 hover:text-rose-600 active:border-rose-300 active:text-rose-200 dark:text-rose-300 dark:hover:text-rose-400"
    onclick={createNewGame}
  >
    Reset and create new game
  </button>
</div>
