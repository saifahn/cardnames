<script lang="ts">
  import { createNewGame } from '$lib/gameState.svelte';
</script>

<div class="mt-4 flex gap-2">
  <button
    class="rounded border border-rose-600 px-4 py-2 text-rose-300 hover:border-rose-700 hover:text-rose-400 active:border-rose-500"
    onclick={createNewGame}
  >
    Reset and create new game
  </button>
</div>
