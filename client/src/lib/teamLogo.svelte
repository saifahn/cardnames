<script lang="ts">
  import MirranWatermark from '$lib/assets/mirran.svg?raw';
  import PhyrexianWatermark from '$lib/assets/phyrexian.svg?raw';
  import type { Team } from '../../../shared/types';

  const { team }: { team: Team | 'assassin' | 'neutral' } = $props();
</script>

{#if team === 'mirran'}
  {@html MirranWatermark}
{:else if team === 'phyrexian'}
  {@html PhyrexianWatermark}
{:else}
  {team}
{/if}
