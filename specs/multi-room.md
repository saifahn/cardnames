# Spec: Support multiple game rooms

## Context

`mtg-codenames` is a Codenames game (Bun WebSocket backend + SvelteKit client) that
currently supports **only one game at a time**. This isn't a deliberate feature — it's
baked into the backend:

- `index.ts:9` holds a single module-level `state: GameState = { game: null }`. Every
  game-logic function (`createNewGame`, `guessCard`, `handleClueSubmission`,
  `handlePassTurn`, `startGame`) mutates that one object via closure.
- Every socket subscribes to the same pub/sub topic `'game'` (`index.ts:258`), and every
  action calls `server.publish('game', ...)`, so all clients always see the same game.
- The client never sends a room identifier (`gameState.svelte.ts`).

**Goal:** let many independent games run at once, keyed by a short shareable **room code**,
so different groups can play simultaneously. The game rules, `Details` status
state-machine, and board rendering stay untouched — this only changes *which* game a given
socket talks to.

**Decisions (confirmed with user):**
- Room code lives in the **URL** for shareable links + survives refresh; also joinable by
  typing the code. Routes restructure to `/game/[roomCode]`.
- Rooms are **deleted when the last player leaves** (per-room socket count → 0).
- **4-letter codes** (e.g. `WXYZ`), with a collision check against existing rooms.

## Backend changes — `index.ts`

1. **Replace the single global with a room map.**
   - `const rooms = new Map<string, GameBaseState | null>()` replacing `state`.
   - Add a per-room connection counter for cleanup, e.g.
     `const roomConnections = new Map<string, number>()`.

2. **Refactor game-logic functions to operate on a passed-in game**, not the global
   closure. Each of `createNewGame`, `startGame`, `guessCard`, `handleClueSubmission`,
   `handlePassTurn` should take/return the relevant room's `GameBaseState` (or accept a
   `roomCode` and read/write `rooms`). `createNewGame` returns a fresh `GameBaseState`
   that the caller stores under the code; the others mutate `rooms.get(code)`.

3. **Room code generation.** Add `generateRoomCode()` → 4 uppercase letters, re-rolling on
   collision with `rooms.has(code)`.

4. **New/changed actions** (all action messages now carry `roomCode`, except creation):
   - `createRoom` — generate a code, create a game, store it, send the code back to the
     creator (`{ roomCode }`), subscribe that socket to the `roomCode` topic.
   - `joinRoom` — given a `roomCode`, if the room exists subscribe the socket to that topic
     and send that room's current state; otherwise send a "room not found" response.
   - `createNewGame`, `startGame`, `submitClue`, `passTurn`, `guessCard` — read
     `parsedMsg.roomCode`, mutate that room, and `server.publish(roomCode, ...)` instead of
     the global `'game'` topic.

5. **Per-connection room tracking + cleanup** using `socket.data`:
   - In `message`/`joinRoom`/`createRoom`: set `socket.data = { roomCode }`, call
     `socket.subscribe(roomCode)`, and increment `roomConnections`.
   - In `close(socket)`: read `socket.data.roomCode`, `unsubscribe`, decrement the counter,
     and when it hits 0 delete both `rooms` and `roomConnections` entries.
   - Remove the unconditional `socket.subscribe('game')` from `open` (subscription now
     happens on create/join).

   Note: Bun's `Bun.serve` needs the `websocket.data` type set (or cast) so `socket.data`
   is typed — define a small `type SocketData = { roomCode?: string }`.

## Frontend changes — `client/`

1. **Restructure routes** so the room code is in the URL:
   - Move `client/src/routes/game/+page.svelte` → `game/[roomCode]/+page.svelte`.
   - Move `game/spymaster/+page.svelte` → `game/[roomCode]/spymaster/+page.svelte`.
   - Move `game/new/+page.svelte` → `game/[roomCode]/new/+page.svelte`.
   - Read the code via `$page.params.roomCode` (or a `load`) and pass it into the
     gameState action calls.

2. **Home page — `client/src/routes/+page.svelte`:**
   - "Create room" → send `createRoom`, await the returned code, then
     `goto('/game/' + code)`.
   - "Join room" → text field for a 4-letter code → `goto('/game/' + code)`.

3. **`client/src/lib/gameState.svelte.ts`:**
   - Track the active `roomCode` (set when a page mounts with a param, or returned from
     `createRoom`).
   - Include `roomCode` in every outgoing message (`startGame`, `passTurn`, `submitClue`,
     `guessCard`, plus a new `createRoom`/`joinRoom`).
   - On entering a room page, send `joinRoom` with the code so this socket subscribes to the
     right topic and receives that room's state. Handle the creator flow (capture the
     returned code) and a "room not found" response (route back home / show a message).

4. **Shared types — `shared/types.ts`:** optionally add a `RoomCreatedResponse`
   (`{ roomCode: string }`) and/or `RoomNotFound` message type so client and server agree on
   the new non-game-state messages. The client's `isGameState` guard already ignores
   non-game-state messages, so these need their own branch in `onmessage`.

## Hosting

Two deployable pieces:

- **Backend (Bun WS server):** needs a host with a long-lived process and WebSocket
  support — Render (the `client/.env` already has a commented `wss://` Render URL),
  Railway, or Fly.io. Single container, `bun run index.ts`, listening on port 3000.
  ⚠️ **Free tiers (incl. Render free) spin the process down after ~15 min idle**, which
  cold-starts the server *and erases every in-memory room*. A real deployment wants a
  paid always-on instance.
- **Frontend (SvelteKit, `adapter-auto`):** static/SSR — deploy to Vercel / Netlify /
  Cloudflare Pages, or alongside the backend. Set `PUBLIC_BACKEND_URL` to the `wss://`
  backend URL in the hosting env.

## Scalability & the single-server in-memory model

The room map lives in **one process's RAM**. Honest assessment of the trade-offs:

- **Memory is *not* the bottleneck.** A room is a 25-card board + status — a few KB.
  Even ~10,000 concurrent rooms is only tens of MB. Other limits bind first.
- **Single point of failure (biggest risk):** a crash, redeploy, or free-tier sleep
  wipes **all active games instantly**, mid-play. No persistence, no recovery.
- **No horizontal scaling (hard ceiling):** WebSocket connections and `server.publish`
  are **per-process**. With 2+ instances behind a load balancer, two players in the same
  room can land on different instances and never see each other's moves. The design is
  capped at what **one** Bun process can serve — which is thousands of concurrent
  connections, likely plenty for this game.
- **No reconnection logic:** the client's `onclose` only logs (`gameState.svelte.ts:51`).
  A network blip or server sleep drops players with no auto-rejoin.

**Migration path (only if/when one server isn't enough):** externalize room state and
pub/sub to **Redis** — Redis pub/sub fans broadcasts across instances; Redis as the room
store survives restarts. That one change unlocks both horizontal scaling and
crash-resilience. The action handlers stay the same shape; only the `rooms` map and
`server.publish` get swapped for Redis calls. Not needed for an MVP single-instance deploy.

A cheaper resilience win short of Redis: add **client reconnect + auto-rejoin** (on
`onclose`, retry the WS connection and re-send `joinRoom` with the URL's room code) so
transient drops don't kick players out of a still-running game.

## Removing the single point of failure

A spectrum of fixes, increasing in effort:

1. **Cheapest — survive *transient* drops, not crashes.** Client auto-reconnect (above):
   on `onclose`, retry the WebSocket and resend `joinRoom` with the URL's code. Doesn't
   help if the *server* dies, but covers the much more common case of a flaky
   network/laptop-sleep dropping a player from a still-alive game.

2. **Survive restarts — persist room state externally.** Periodically (or on every
   mutation) write each room's `GameBaseState` to something outside the process — Redis,
   a SQLite file, or a managed KV store. On boot, reload any rooms with recent activity.
   Fixes "deploy wiped my game" without solving horizontal scaling. Redis is the natural
   choice since it gives persistence *and* pub/sub fan-out in one step (see #3).

3. **Real fix — Redis as shared state + pub/sub.** This is the one that actually removes
   the SPOF rather than patching around it:
   - **Room state** moves from the in-memory `Map` to Redis (a hash or JSON blob per room
     code). Any instance can read/write any room.
   - **Broadcast** moves from `server.publish(topic, ...)` to Redis pub/sub — each Bun
     instance subscribes to the Redis channels for the rooms it has local sockets for, and
     republishes to its own local `server.publish`. This is the standard "Socket.IO Redis
     adapter" pattern.
   - This unlocks running **multiple Bun instances** behind a load balancer correctly, and
     a single instance crashing no longer loses any room — Redis still has it, other
     instances keep serving.
   - Cost: Redis itself becomes a dependency, but managed Redis (Upstash, Render's own
     Redis, Railway) has far better availability guarantees than a single hobby web
     service, and it's a well-understood SPOF to manage (replicas, AOF persistence).

4. **Belt-and-suspenders — health checks + auto-restart.** Configure the host
   (Render/Railway/Fly) to auto-restart the process on crash. Combined with #2/#3, a crash
   becomes a few-second blip instead of data loss.

**Recommendation:** for this project's scale, skip straight to **Redis (#2+#3 combined)**
if the goal is to genuinely solve the SPOF — it's barely more work than a
persistence-only layer and future-proofs horizontal scaling at the same time. If the goal
is just resilience against a free-tier instance sleeping/restarting without touching
infra, **#1 + #2 (Redis as a persistence-only store, single instance)** is the lighter
lift.

## Out of scope (not requested)
- Listing/browsing active rooms (lobby).
- Per-player identity / team membership (the stubbed `login` + `// add logged in users`
  TODO stays as-is).
- Persistence across server restarts (rooms remain in-memory).

## Verification

1. **Run both apps:** backend `bun run index.ts` (port 3000); client `cd client && vite dev`.
   Confirm `client/.env` `PUBLIC_BACKEND_URL="ws://localhost:3000"`.
2. **Two-room isolation:** open two browser windows. In window A click "Create room", note
   the code/URL, create + start a game, flip a card. In window B create a *different* room
   and confirm its board is independent (different cards, A's flips don't appear).
3. **Join flow:** copy window A's `/game/XXXX` URL into a third window (or type the code on
   the home page) — it should load A's current game and stay in sync (flip a card in A, see
   it in the third window).
4. **Refresh:** reload a `/game/XXXX` page and confirm it rejoins the same room and shows
   current state.
5. **Cleanup:** close all windows for a room, then re-join its code — should report "room
   not found" (game was deleted at zero connections). Check server logs for the
   create/join/close lifecycle.
6. **Unknown code:** navigate to `/game/ZZZZ` for a non-existent room → graceful
   "room not found" handling, no crash.
7. `cd client && bun run check` for type-safety on the new params/messages.
