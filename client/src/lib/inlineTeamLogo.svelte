<script lang="ts">
  import type { CardIdentity } from '../../../shared/types';
  import { textColorBasedOnIdentity } from './colors.svelte';

  const { identity }: { identity: CardIdentity } = $props();

  const iconClass = $derived.by(() => {
    switch (identity) {
      case 'emrakul':
        return 'ms-dfc-emrakul';
      case 'mirran':
        return 'ms-watermark-mirran';
      case 'phyrexian':
        return 'ms-watermark-phyrexian';
      case 'neutral':
        return 'ms-token';
    }
  });
</script>

<span
  class="inline-flex items-baseline gap-1 font-semibold capitalize {textColorBasedOnIdentity(
    identity
  )}"><i class="ms {iconClass}"></i>{identity}</span
>
