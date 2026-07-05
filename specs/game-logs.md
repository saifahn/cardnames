# Spec: Game logs

## Context

Resolves #15, "Add game logs" — *"It would be nice to see all the previous actions in
the game."* Today the server has no memory of what happened earlier in a game: every
action (`index.ts:264-320`) mutates the single `state.game` in place and broadcasts the
resulting snapshot, but nothing records the *sequence* of clues, guesses, and turn
changes that produced that snapshot. A player who looks away for a moment, or joins
partway through, has no way to see what already happened — only the current `details`
(which itself gets overwritten by the next action).

This spec adds a server-maintained **history** of log entries to the existing single
global game, broadcast alongside the rest of `GameBaseState` on the existing
`server.publish('game', ...)` channel, and rendered as a simple chronological list in the
client. Like [`specs/players-teams-roles.md`](./players-teams-roles.md) and
[`specs/multi-room.md`](./multi-room.md), this is written as a buildable increment on
today's one-game, no-rooms, no-player-identity architecture — see
[`CONTEXT.md`](../CONTEXT.md) for the Team/Agent/Emrakul glossary used below.

No ADR is needed: this is additive (a new array on `GameBaseState`, populated at existing
mutation sites) and doesn't change any existing message shape, authority model, or
transport decision.

## Decisions

1. **What gets logged — one entry per state-changing player action, not per connection
   event.** `login` (`index.ts:275-280`) is purely a per-socket handshake (it doesn't
   touch `state.game`) and is **not** logged. The other five actions each produce exactly
   one entry:
   - `createNewGame` (`index.ts:282-286`) → a `gameCreated` entry recording which team goes
     first (`state.game.currentTurn`, set in `createNewGame()` at `index.ts:36`).
   - `startGame` (`index.ts:288-292`) → a `gameStarted` entry (no extra data beyond a
     timestamp; the starting team is already in the preceding `gameCreated` entry).
   - `submitClue` (`index.ts:294-300`) → a `clueGiven` entry capturing the team that clued
     (`state.game.currentTurn` *before* `handleClueSubmission` runs — clueing doesn't change
     `currentTurn`) and the clue itself (`parsedMsg.clue.word`, `parsedMsg.clue.number`).
   - `guessCard` (`index.ts:308-316`) → a `cardGuessed` entry. Built **after**
     `guessCard()` mutates state, so it can report the now-`flipped` card's true identity
     and the outcome. Captures: the guessing team (the `currentTurn` *at the time of the
     guess*, captured before the call, since a wrong guess flips `currentTurn` inside
     `guessCard()` — see decision 3 below for why this is safe to log), the card's word and
     board position (`parsedMsg.position`, `parsedMsg.name` — already validated against
     each other inside `guessCard()`, `index.ts:117-120`), the revealed `identity`, and
     whether it was a hit for the guessing team, a hit for the opposing team, neutral, or
     Emrakul (derived the same way `guessCard()` itself branches at `index.ts:130-199`).
   - `passTurn` (`index.ts:302-306`) → a `turnPassed` entry capturing the team that passed
     (`state.game.currentTurn` *before* `handlePassTurn()` flips it at `index.ts:238`).

   Game-over is **not** a separate action — it's a `details.status` produced inside
   `guessCard()` (`gameOverEmrakul` / `gameOverAgents`, `index.ts:135-138, 146-151,
   184-189`). The `cardGuessed` entry's `outcome` field carries this (see Domain model
   below), so there's no separate "game over" log entry — the guess that ended the game is
   the entry that explains why.

2. **One discriminated union, not optional fields.** `LogEntry` is a union tagged by a
   `type` field, one variant per bullet above (`GameCreatedLogEntry`,
   `GameStartedLogEntry`, `ClueGivenLogEntry`, `CardGuessedLogEntry`,
   `TurnPassedLogEntry`). This mirrors the existing `Details` union in
   `shared/types.ts:76-86` (also tagged by `status`), keeps each entry's fields required
   instead of a pile of optionals, and lets the client `{#each}` over entries with a
   `{#if entry.type === ...}` switch exactly like `gameInfoSection.svelte` already
   switches on `details.status` (`gameInfoSection.svelte:31-99`).

3. **History piggybacks on the existing full-state broadcast — no new message type.**
   Every action that mutates `state.game` already calls
   `server.publish('game', JSON.stringify(state))` (`index.ts:285, 291, 299, 305, 315`).
   `history` becomes a field on `GameBaseState` itself, so it rides along for free: append
   the new entry to `state.game.history` *before* the existing `server.publish` call at
   each site, and nothing about the transport changes. No new client message handler,
   no new pub/sub topic, no redaction logic to write.

   **On secrecy:** a `cardGuessed` entry only exists *after* `guessCard()` has already set
   `targetCard.flipped = true` (`index.ts:128`) and the full board — including that card's
   real `identity` — is already part of the very same broadcast that carries the log entry
   (the board is part of `state.game`, sent in the same `JSON.stringify(state)`). A log
   entry never describes an *unflipped* card's identity; it only ever restates something
   the broadcast itself just made public. So logging revealed identities adds no new leak
   today, and (per ADR 0001) will need no special handling later either: once the server
   redacts unflipped identities from the *board*, a `cardGuessed` entry is still only ever
   created for a card that has just been flipped, i.e. one whose identity the redacted
   broadcast is, at that same moment, no longer hiding from anyone. The one piece of
   future-facing care called out for the ADR 0001 work: don't let a *clue* itself leak
   into history in a way that exposes the spymaster's key — this spec's `clueGiven` entry
   only stores the clue word/number actually spoken aloud (already visible to everyone,
   spymaster and operatives alike, today), never the underlying key, so it carries no
   additional risk.

4. **Render as a reverse-chronological panel, newest entry first**, in a new
   `gameLog.svelte` component. One line of plain text per entry (team-colored team name,
   same convention as `InlineTeamLogo`), no avatars/timestamps in the UI (a `createdAt`
   field exists in the data for future use but isn't displayed in v1).

5. **Unbounded history for the life of one game.** No cap. A game's board is 25 cards;
   even a long game produces on the order of tens of entries (≤25 guesses + a handful of
   clues/passes), each a few dozen bytes — negligible next to the board itself. This
   matches the "memory is not the bottleneck" reasoning in
   [`specs/multi-room.md`](./multi-room.md#scalability--the-single-server-in-memory-model):
   the in-memory game state already lives for free until `createNewGame` replaces it
   (`index.ts:92`), at which point `history` resets along with everything else.

## Domain model — `shared/types.ts`

```ts
interface LogEntryBase {
  id: string // crypto.randomUUID(), for stable Svelte #each keys
  createdAt: number // Date.now(), not rendered in v1, reserved for later use
}

export interface GameCreatedLogEntry extends LogEntryBase {
  type: 'gameCreated'
  firstTeam: Team
}

export interface GameStartedLogEntry extends LogEntryBase {
  type: 'gameStarted'
}

export interface ClueGivenLogEntry extends LogEntryBase {
  type: 'clueGiven'
  team: Team
  clue: { word: string; number: string | null }
}

export interface CardGuessedLogEntry extends LogEntryBase {
  type: 'cardGuessed'
  team: Team // the team that guessed
  word: string
  position: [number, number]
  identity: CardIdentity // the revealed identity
  outcome: 'ownAgent' | 'opposingAgent' | 'neutral' | 'emrakul'
}

export interface TurnPassedLogEntry extends LogEntryBase {
  type: 'turnPassed'
  team: Team // the team that passed
}

export type LogEntry =
  | GameCreatedLogEntry
  | GameStartedLogEntry
  | ClueGivenLogEntry
  | CardGuessedLogEntry
  | TurnPassedLogEntry
```

- `GameBaseState` (`shared/types.ts:88-96`) gains a `history: LogEntry[]` field, initialized
  to `[]` in `createNewGame()` and appended to (never replaced) by every other action.
- `outcome` on `CardGuessedLogEntry` is derived, not stored redundantly with
  `details.status` — it's computed once at the `guessCard` call site (see below) from the
  same branches `guessCard()` already evaluates, so the log doesn't need to re-derive
  anything `index.ts` doesn't already know at that point.

## Backend changes — `index.ts`

1. **`createNewGame()` (`index.ts:33-93`):** initialize `history: []` in the `game` object
   literal (`index.ts:80-91`), then immediately push a `gameCreated` entry
   (`{ type: 'gameCreated', firstTeam: currentTurn, id: crypto.randomUUID(), createdAt:
   Date.now() }`) — `currentTurn` is already computed at `index.ts:36`.

2. **`startGame()` (`index.ts:95-104`):** after setting `details`, push a `gameStarted`
   entry onto `state.game.history`.

3. **`handleClueSubmission(clue)` (`index.ts:202-225`):** capture `state.game.currentTurn`
   into a local before mutating `details` (it isn't changed by this function, but doing so
   keeps the pattern consistent with `guessCard`/`handlePassTurn` below and guards against
   future changes), then push a `clueGiven` entry with that team and the `clue` parameter
   (already validated non-empty at `index.ts:208`).

4. **`guessCard(position, name)` (`index.ts:107-200`):** capture `currentTeam` (already a
   local at `index.ts:126`) before any mutation. At each of the four outcome branches
   (Emrakul `index.ts:130-140`; own-team hit `index.ts:142-170`; neutral `index.ts:172-180`;
   opposing-team hit `index.ts:182-199`), push one `cardGuessed` entry with `team:
   currentTeam`, `word: name`, `position`, `identity: targetCard.identity`, and the
   matching `outcome` (`'emrakul'`, `'ownAgent'`, `'neutral'`, `'opposingAgent'`
   respectively) before each early `return`. Since every branch returns, exactly one entry
   is ever pushed per call — simplest to add the push as the first line of each branch
   right after `targetCard.flipped = true` is set (`index.ts:128`), since `identity` is
   already known by then regardless of which branch is about to run.

5. **`handlePassTurn()` (`index.ts:227-239`):** capture `state.game.currentTurn` *before*
   the reassignment at `index.ts:238`, push a `turnPassed` entry with that team.

6. **No changes to the `message` handler's `server.publish` calls** (`index.ts:285, 291,
   299, 305, 315`) — `history` is just another field on the already-published `state`.

## Frontend changes — `client/`

1. **New `client/src/lib/gameLog.svelte`:** takes no props (reads `gameState` directly,
   same convention as `gameInfoSection.svelte`). Renders
   `gameState.game?.history` reversed (`.slice().reverse()`) inside a scrollable list,
   `{#each ... (entry.id)}`, with an `{#if entry.type === ...}` per variant producing a
   single line of text, e.g.:
   - `gameCreated` → "New game started — `<InlineTeamLogo identity={entry.firstTeam} />`
     goes first."
   - `gameStarted` → "The game has started."
   - `clueGiven` → "`<InlineTeamLogo identity={entry.team} />` spymaster clued
     **{entry.clue.word}** ({entry.clue.number})."
   - `cardGuessed` → "`<InlineTeamLogo identity={entry.team} />` guessed **{entry.word}**
     — " plus one of: "a `<InlineTeamLogo identity={entry.team} />` agent." (ownAgent),
     "a `<InlineTeamLogo identity={getOpposingTeam(entry.team)} />` agent."
     (opposingAgent), "a neutral card." (neutral), or "Emrakul!" (emrakul) — reusing
     `InlineTeamLogo` (`client/src/lib/inlineTeamLogo.svelte`) the same way
     `gameInfoSection.svelte` does throughout.
   - `turnPassed` → "`<InlineTeamLogo identity={entry.team} />` passed the turn."

2. **Placement:** render `<GameLog />` from `client/src/routes/game/+page.svelte` and
   `client/src/routes/game/spymaster/+page.svelte`, alongside `<GameInfoSection />` and
   `<Board />` (both files already follow the identical `{#if gameState.game ===
   null}...{:else if ...gameReady}<GameReadyScreen />{:else}...{/if}` shape — add
   `<GameLog />` in the final `{:else}` branch of both, e.g. right after `<Board />` in
   `client/src/routes/game/+page.svelte:13-15` and
   `client/src/routes/game/spymaster/+page.svelte:58`). No log during `gameReady`
   (nothing has happened yet beyond `gameCreated`, which isn't worth surfacing before the
   player even sees the board) — optional follow-up, not blocking.

3. **`client/src/lib/gameState.svelte.ts`:** no changes needed. `history` arrives as part
   of the existing `gameState.game` object already assigned in `onmessage`
   (`gameState.svelte.ts:45-48`); no new action senders, no new message branch.

4. **Types:** the component imports `LogEntry` (and the per-variant types it needs to
   narrow on) from `../../../shared/types`, same import path used elsewhere
   (`board.svelte:2`, `gameInfoSection.svelte:3`).

## Relationship to other specs

- **[`specs/players-teams-roles.md`](./players-teams-roles.md):** once Players exist,
  entries could optionally attribute actions to a `playerId`/name rather than just a
  `Team` (e.g. "Alice (Mirran spymaster) clued ISLAND"). Not required by this spec —
  `team` alone is sufficient today since there's no player identity to attach. When that
  spec lands, extending each variant with an optional `playerName`/`playerId` is a small,
  additive follow-up; this spec deliberately doesn't speculate further on that shape.
- **[`specs/multi-room.md`](./multi-room.md):** composes trivially. `history` lives on
  `GameBaseState`, and that spec's refactor moves `GameBaseState` from the single global
  `state.game` into a per-room map — `history` just rides along as a field on whichever
  object represents "the room's game," with no special-casing needed.
- **ADR 0001 (server-authoritative redacted state):** as argued in Decision 3, log entries
  never need redaction — they're only ever created for already-public, already-flipped
  information. No follow-up work is anticipated here when that ADR is implemented, beyond
  double-checking (in review, not in code) that no future log-entry type is added for an
  action that exposes *unflipped* identities.

## Out of scope

- **Persistence across server restarts.** `history` lives in memory exactly like the rest
  of `GameBaseState` and is lost on restart or `createNewGame` — consistent with this
  project's no-persistence stance (see `specs/multi-room.md`'s Out of scope and ADR 0002).
- **Exporting, sharing, or copying the log** (e.g. a "copy log to clipboard" button).
- **Replay or undo from the log.** The log is read-only history, not a mechanism for
  rewinding game state.
- **Capping/pagination.** Per Decision 5, unbounded for one game's lifetime; revisit only
  if a future change makes games meaningfully longer-lived (e.g. a "best of N" mode).
- **Per-room scoping.** Doesn't exist yet because rooms don't exist yet (see Relationship
  to other specs above); nothing here blocks `multi-room.md` from adding it later.
- **Attributing entries to individual players** rather than teams — blocked on
  `specs/players-teams-roles.md` landing first; see Relationship to other specs.

## Verification

1. Run the backend (`bun run index.ts`, port 3000) and client (`cd client && vite dev`).
2. **Entries appear in order:** create a game, start it, submit a clue, guess a correct
   card, guess an incorrect card, pass the turn — confirm `gameLog.svelte` shows one new
   line per action, newest first, with the right team names and words.
3. **Game-over entry:** play (or rig, by guessing Emrakul) until the game ends — confirm
   the final `cardGuessed` entry's wording matches the actual outcome (Emrakul loss vs.
   last-agent win) without needing a separate "game over" line.
4. **Survives reconnect:** open a second browser window mid-game — confirm it receives the
   full `history` array (not just entries created after it joined), since the whole
   `GameBaseState` (including `history`) is sent on every broadcast.
5. **Resets correctly:** after game-over, click "Reset and create new game" — confirm the
   log clears down to just the new `gameCreated` entry, not a continuation of the previous
   game's history.
6. `cd client && bun run check` for type-safety on the new `LogEntry` union and the
   `gameLog.svelte` component's narrowing.
