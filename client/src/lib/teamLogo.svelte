<script lang="ts">
  import type { Team } from '../../../shared/types';

  const { team }: { team: Team | 'assassin' | 'neutral' } = $props();
</script>

{#if team === 'mirran'}
  <i class="ms ms-watermark-mirran ms-4x"></i>
{:else if team === 'phyrexian'}
  <i class="ms ms-watermark-phyrexian ms-4x"></i>
{:else if team === 'assassin'}
  <i class="ms ms-dfc-emrakul ms-4x"></i>
{:else}
  <i class="ms ms-token ms-4x"></i>
{/if}
