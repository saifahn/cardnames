<script lang="ts">
  import type { Team } from '../../../shared/types';
  import { textColorBasedOnIdentity } from './colors.svelte';

  const { team }: { team: Team } = $props();
</script>

<span
  class="inline-flex items-baseline gap-1 font-semibold capitalize {textColorBasedOnIdentity(team)}"
  ><i class="ms ms-watermark-{team}"></i>{team}</span
>
