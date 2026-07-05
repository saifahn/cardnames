# Account-less token identity

Players need an identity the server can enforce actions against (which Team/Role they
hold), and that identity needs to survive a page refresh — but this is a casual,
no-signup game, so a real account system would be disproportionate.

We chose to have the server mint a `{ playerId, token }` pair on first join, which the
client persists in `localStorage` and re-presents to reclaim its seat on reconnect. There
are no credentials, no accounts, and no server-side persistence beyond the running game.

**Trade-off accepted:** anyone who obtains another player's token (e.g. by sharing a
browser or inspecting `localStorage`) can impersonate them. This is acceptable for a
casual game among trusted players; it would not be acceptable if this ever needed real
auth (e.g. ranked play, persistent accounts).
