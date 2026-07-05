# Server-authoritative redacted game state

Today the server broadcasts the full board (every card's true identity) to all clients via
a single `server.publish('game', ...)`, and the client decides whether to render identities
based on a `spymasterView` flag/route. This means the key is already present in every
operative's browser — anyone can open dev tools (or just the spymaster route) and see it.

Once Roles are enforced server-side (see `specs/players-teams-roles.md`), we're rejecting
the premise that the client can be trusted with secrets it shouldn't have. We decided the
server must redact unflipped card identities before sending to operatives, and only send
the full key to the assigned spymaster. This means replacing the single broadcast with
per-role payloads (two pub/sub topics per room, or per-socket sends) — a real shift in the
messaging model, but the only way real Codenames secrecy actually exists.

**Consequence:** every place that currently reads `card.identity` on the client must handle
it being `undefined` for unflipped cards in the operative view.
