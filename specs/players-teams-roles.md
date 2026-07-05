# Spec: Players, Teams & Roles (the "login" feature)

## Context (problem)

Today the game has no concept of *who* is playing:
- **Team** (`mirran`/`phyrexian`) is only a card identity + `currentTurn`; no player belongs to a team.
- **Role** (spymaster/operative) is a pure client-side view flag (`spymasterView`,
  `gameReadyScreen.svelte:10`); you "become" a spymaster just by visiting `/game/spymaster`
  (`gameReadyScreen.svelte:99`). The two views are two hardcoded routes that pass
  `spymasterView` (`routes/game/+page.svelte`, `routes/game/spymaster/+page.svelte`).
- `login` is a stub (`index.ts:275`) that echoes state with a throwaway UUID. `GameBaseState`
  carries the TODO `// add logged in users and users by team` (`types.ts:95`).
- **No enforcement & no secrecy:** the full board (every identity) is broadcast to everyone via
  `server.publish('game', ...)`; the *client* hides identities for operatives
  (`board.svelte:36`). So any operative can open `/game/spymaster` and read the whole key.

**Goal:** assign Players to Teams and Roles, server-side, and enforce them — turning the
stubbed `login` TODO into a real (account-less) identity + lobby system.

See [`CONTEXT.md`](../CONTEXT.md) for the Player/Team/Role/Agent/Lobby glossary.

## Decisions

1. **Server enforces integrity rules.** Only the current team's spymaster may submit a clue;
   only the current team's operatives may guess; operatives never receive the key.
2. **Identity: server-issued token in `localStorage`.** On first join the server mints
   `{ playerId, token }`; client stores it and re-presents it to reclaim the same seat on
   refresh/reconnect. No accounts.
3. **Self-select Team and Role** in a lobby; server enforces constraints.
4. **Exactly one spymaster per Team, exclusive** (first-come locks the seat); unlimited operatives.
5. **Start gated on composition:** each Team must have its spymaster seat filled **and** ≥1
   operative. Any Player may press Start once valid.
6. **Disconnect: hold the seat, allow takeover if vacated.** Reconnect-by-token reclaims it;
   UI flags a disconnected Player; a teammate can explicitly take over a vacated role so a
   gone-for-good spymaster never bricks the game.
7. **Server-authoritative redacted state** (see ADR 0001): operatives receive a board with no
   identities on **unflipped** cards; only spymasters get the full key. Flipped cards are public
   to all. Replaces the single broadcast with per-role tailored state.
8. **Players have display names**, prompted on join (blank → auto fallback like `Player-AB12`).
9. **Team/Role locked once the game starts**, except the disconnect-takeover in (6).

## Domain model — `shared/types.ts`

```ts
export type Role = 'spymaster' | 'operative'

// Server-side (never sent to clients): includes the secret token
interface ServerPlayer {
  id: string
  token: string          // secret; reconnection credential
  name: string
  team?: Team            // undefined until chosen (lobby)
  role?: Role            // undefined until claimed
  connected: boolean
}

// Public projection sent in game state (no token)
export interface Player {
  id: string
  name: string
  team?: Team
  role?: Role
  connected: boolean
}

// Redacted board cell: identity present only when flipped (or for spymasters, always)
export interface RedactedBoardSpace {
  word: string
  flipped: boolean
  identity?: CardIdentity   // omitted for unflipped cards in the operative view
}
```
- `GameBaseState` gains `players: Player[]` (replacing the `// add logged in users` TODO). The
  server's working copy holds `ServerPlayer[]`; the public state maps to `Player[]`.
- The board type the **client** consumes becomes `RedactedBoardSpace[][]` (identity optional).
  `board.svelte` must render a face-down card when `identity` is absent.

## Backend changes — `index.ts`

1. **Player store per room/game.** Hold `ServerPlayer[]` on the game; map each socket to a
   player via `socket.data = { playerId }`.
2. **Identity / join (replaces `login`):** `join { roomCode?, token?, name? }` →
   - If `token` matches an existing player, re-attach (set `connected=true`, update socket map)
     — this is the reconnect/refresh path.
   - Else mint `{ id, token }`, create a `ServerPlayer` (unassigned, in the lobby), and send the
     token back to that socket so the client can persist it.
3. **Lobby actions** (pre-game): `setName`, `chooseTeam { team }`, `claimRole { role }`.
   - `claimRole('spymaster')` fails if the team's spymaster seat is taken (decision 4).
   - All blocked once `status` has left `gameReady`/lobby (decision 9), except `takeOverRole`.
4. **`takeOverRole { team, role }`** — mid-game claim of a seat whose holder is `connected=false`
   (decision 6).
5. **Enforce on existing actions** (decision 1) using `socket.data.playerId` → player:
   - `submitClue` — reject unless caller is the **current team's spymaster**.
   - `guessCard` — reject unless caller is a **current team's operative**.
   - `startGame` — reject unless composition is valid (decision 5).
6. **Redacted broadcast** (decision 7) — replace `server.publish('game', fullState)` with two
   payloads:
   - **Full** (real identities) → spymasters.
   - **Redacted** (`RedactedBoardSpace` with unflipped identities stripped) → operatives +
     unassigned/lobby players.
   - Mechanism: keep Bun pub/sub but use **two topics per room** —
     `room:<code>:full` and `room:<code>:redacted`; publish both on every change. A socket is
     subscribed to exactly one based on its player's current role, re-subscribing when the role
     changes. (Fallback if topic juggling gets hairy: iterate the room's sockets and
     `socket.send` a per-socket payload.) Player roster (`players`) is identical in both payloads.
7. **Disconnect (`close`)** — set `connected=false`, keep the seat, re-broadcast roster. Do **not**
   release (decision 6).

## Frontend changes — `client/`

1. **Token persistence + identity — `gameState.svelte.ts`:**
   - Read/write the player token in `localStorage`; send it on `join`; store the returned token.
   - Track `myPlayer` (id/name/team/role) derived from the roster + my id.
   - New action senders: `join`, `setName`, `chooseTeam`, `claimRole`, `takeOverRole`.
   - `onmessage`: handle the token-issued message and the tailored game state (board may now lack
     identities). The existing `isGameState` guard already ignores non-state messages.
2. **Lobby / team-select UI** (replaces navigation-based role choice in `gameReadyScreen.svelte`):
   - Name prompt; two team columns showing the roster (`players` grouped by team) with
     connected/disconnected indicators; "Join team", "Claim spymaster" (disabled if taken),
     "Become operative" buttons; a Start button enabled only when composition is valid.
3. **Role-driven views (collapse the spymaster route):**
   - `board.svelte` — `spymasterView` becomes `$derived(myPlayer?.role === 'spymaster')` instead of
     a prop/route; render face-down when `identity` is absent (`board.svelte:36-39`); only show the
     "Guess card" button to a current-team operative (`board.svelte:41`).
   - Clue-input form (`routes/game/spymaster/+page.svelte:30-57`) moves into the single game view,
     shown only to the current team's spymaster.
   - `routes/game/spymaster/+page.svelte` is **removed**; `/game` renders role-appropriately. (Under
     the multi-room spec this is `/game/[roomCode]`.)

## Relationship to the multi-room spec
Composes with [`specs/multi-room.md`](./multi-room.md): a Player belongs to a room, and the
two-topic redaction layers onto the per-room topics there. Shippable independently — the
"room" can be today's single global game. The reconnect-by-token here also delivers the client
auto-rejoin noted in that spec.

## Out of scope
- Real authentication / accounts / persistence of players across server restarts.
- Spectators, chat, multiple concurrent spymasters, team auto-balancing.
- Scoreboards / cross-game player history.

## Verification
1. Run backend (`bun run index.ts`) + client (`cd client && vite dev`).
2. **Identity persists:** join, set a name, refresh the page → same seat/name reclaimed (token).
3. **Self-select + exclusivity:** with 4 browser windows, each picks a team; the 2nd attempt to
   claim a team's spymaster is rejected (seat shows taken). Confirm rosters match across windows.
4. **Start gating:** Start is disabled until both teams have a spymaster + ≥1 operative; becomes
   enabled when satisfied.
5. **Secrecy (the core win):** as an operative, inspect the WebSocket frames — unflipped cards have
   **no identity**; the spymaster view does. Flipped cards show identity to everyone.
6. **Action enforcement:** an operative's `submitClue` is rejected; a non-current-team operative's
   `guessCard` is rejected; the off-turn spymaster can't clue.
7. **Disconnect/takeover:** close the spymaster window mid-game → teammates see them disconnected
   and can take over the role; original can also reconnect (token) to reclaim if not taken.
8. `cd client && bun run check` for type-safety on the new `Player`/`RedactedBoardSpace` shapes.
