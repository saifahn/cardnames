export function textColorBasedOnIdentity(identity: string) {
  if (identity === 'assassin') return 'text-indigo-700 dark:text-indigo-500';
  if (identity === 'neutral') return 'text-stone-500';
  if (identity === 'mirran') return 'text-sky-500';
  if (identity === 'phyrexian') return 'text-rose-500';
}
