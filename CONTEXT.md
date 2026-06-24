# mtg-codenames

A Magic: The Gathering-themed Codenames implementation. This is the glossary for the
game's domain language — terms specific to this project, not general programming concepts.

## Language

**Player**:
A participant connected to a room, identified by a server-issued id + secret token (no
account/credentials). Distinct from a Team's cards.
_Avoid_: User, account.

**Team**:
One of the two sides, `mirran` or `phyrexian`. A Player belongs to at most one Team; a
card's `identity` can also be a Team (meaning that card belongs to that Team).

**Role**:
A Player's function within their Team: `spymaster` (sees the full key, gives clues) or
`operative` (guesses cards). Exactly one spymaster per Team; unlimited operatives.

**Agent**:
A board card belonging to a Team — what operatives are trying to find ("9 agents to
find"). Not a Player.

**Emrakul**:
The single instant-loss card identity. If revealed, the guessing Team loses immediately.
_Avoid_: Assassin (the generic Codenames term — this project always says Emrakul).

**Lobby**:
The pre-game phase of a room where Players choose their Team and Role before the game
Starts. Team/Role assignments lock once the game starts (see
[ADR 0002](./docs/adr/0002-account-less-token-identity.md) and
[`specs/players-teams-roles.md`](./specs/players-teams-roles.md)).

**Room**:
An independent game instance, addressed by a short shareable code. See
[`specs/multi-room.md`](./specs/multi-room.md).
