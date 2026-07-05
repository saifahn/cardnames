# Spec: Card list selection

## Context

Resolves #13, "Add card list selection." Today the server loads exactly one card pool at
startup (`index.ts:13-15`): `cardlists/mtgo-vintage-cube-nov-2024.txt`, a 540-card
plain-text file (one name per line — e.g. "Benevolent Bodyguard", "Esper Sentinel").
`getRandomCards()` (`index.ts:20-29`) draws from this single array; `createNewGame()`
(`index.ts:33-93`) passes that array in and knows nothing else. A group who wants to play
with a different cube or set has no option — the list is hardcoded.

This spec adds support for multiple named card lists, each a JSON file in `cardlists/`,
selectable via a dropdown on the home page at game-creation time. It establishes the file
format (`{ name, imageUrl }[]`), a server-side whitelist registry, and the extended
`createNewGame` message that carries a `listId`. It also adds `imageUrl` as a required
field on `BoardSpace` so the data is available to every downstream consumer without a
second lookup — this simultaneously lays the foundation for issue #18 (card image view).

Like [`specs/game-logs.md`](./game-logs.md) and [`specs/multi-room.md`](./multi-room.md),
this spec is written as a buildable increment on today's architecture — see
[`CONTEXT.md`](../CONTEXT.md) for the Team/Agent/Emrakul glossary used below.

No ADR is needed: the transport, pub/sub topology, and authority model are unchanged. This
is a format migration on one data file plus small additive changes to an existing message
and two types.

## Decisions

1. **Format: `.txt` → JSON array.** `cardlists/mtgo-vintage-cube-nov-2024.txt` (and any
   future list file) becomes a `.json` file whose content is a JSON array of objects:
   `{ name: string, imageUrl: string }`. URLs are baked into the file at list-authoring
   time — the Scryfall image URL for each card is looked up once when the list is written
   and stored statically (e.g.
   `"https://cards.scryfall.io/normal/front/3/d/3d467e81-....jpg"`). The server never
   fetches from Scryfall at runtime.

2. **`imageUrl` is required everywhere.** There is no optional/absent-means-no-image path.
   Every entry in every list file must have a populated `imageUrl`, and `BoardSpace` gains
   `imageUrl: string` as a required field. This keeps downstream consumers (current and
   future) free of null checks and conditional rendering branches for the missing-image
   case.

3. **Whitelist registry in `index.ts`.** A small hardcoded object (`LIST_REGISTRY`) maps
   each short `listId` string (e.g. `'vintage-cube'`) to a display name and filename. The
   client sends `listId` in the `createNewGame` message; the server validates it against
   the registry before touching the filesystem. The server never constructs a path from the
   raw client string (no `Bun.file('./cardlists/' + parsedMsg.listId)`).

4. **All registered lists are loaded eagerly at startup.** Because list files are small
   (the existing 540-card file is well under 100 KB as JSON) and the process is
   long-lived, loading all registered files into a `Map<string, CardEntry[]>` at startup
   is simpler and faster per request than lazy loading. A per-request JSON parse is
   unnecessary; per-game, `getRandomCards()` only needs a reference to the
   already-parsed array.

5. **List chosen at game-creation time.** The home page (`client/src/routes/+page.svelte`)
   gains a `<select>` dropdown adjacent to the "Create game" button. The selected `listId`
   is sent in the `createNewGame` WebSocket message. There is no list picker inside the
   lobby or game view — the choice is made before the game is created, same as today's
   implicit single-list behavior.

6. **Client hardcodes the registry values — no server round-trip.** The dropdown's option
   labels and values are the same `listId`/`displayName` pairs from `LIST_REGISTRY`,
   duplicated client-side as a small literal. The registry is static and changes only with
   a deploy, so a separate "list available lists" message would add complexity for no gain.
   If the two copies drift, the server's registry is authoritative (an invalid `listId` is
   rejected).

7. **Backward-compatible default for missing `listId`.** If a client sends
   `{ action: 'createNewGame' }` without a `listId` (e.g., old client code during a
   rolling update), the server falls back to `DEFAULT_LIST_ID` (the designated default
   entry in `LIST_REGISTRY`) and emits `console.warn`. This avoids breaking an in-flight
   session during a deploy while still making the field expected going forward.

8. **Invalid `listId` is rejected with `console.error` + `return`.** If `parsedMsg.listId`
   is a non-null value that does not exist in `LIST_REGISTRY`, the handler logs
   `console.error` and returns without mutating state — the same pattern used for other
   validation failures in the file (e.g. `index.ts:208-210` in `handleClueSubmission`,
   `index.ts:109-111` in `guessCard`). No error message is sent back to the client in this
   spec (consistent with today's convention; #16's Zod adoption will be the right moment
   to standardise client-facing error responses).

9. **`CardEntry` lives in `index.ts` as a local type — not exported to the client.** The
   client only ever sees `BoardSpace` (which now carries `imageUrl`), never the raw list
   entry. Exporting `CardEntry` from `shared/types.ts` would expose a server-only concern
   to the client type graph. A one-line `type CardEntry = { name: string; imageUrl: string
   }` at the top of `index.ts` is sufficient.

10. **`imageUrl` on `BoardSpace` requires no redaction.** Image URLs are not secret: they
    show the card's face but carry no information about which team that card belongs to
    (`identity` is what is secret, and remains subject to ADR 0001). Both spymaster and
    operative views receive `imageUrl` equally; no per-role filtering is needed.

## Domain model — `shared/types.ts`

`BoardSpace` (`shared/types.ts:9-13`) gains one required field:

```ts
export interface BoardSpace {
  word: string
  identity: CardIdentity
  flipped: boolean
  imageUrl: string   // new; pre-populated Scryfall image URL
}
```

`GameBaseState` (`shared/types.ts:88-96`) is unchanged by this spec.

The raw list entry type is **not** added to `shared/types.ts`. It is a local, server-only
type in `index.ts` (decision 9):

```ts
// index.ts, near top — server-only, not exported
type CardEntry = { name: string; imageUrl: string }
```

## Backend changes — `index.ts`

### 1. `CardEntry` type, `LIST_REGISTRY`, and eager load (replaces lines 13-15)

```ts
type CardEntry = { name: string; imageUrl: string }

const LIST_REGISTRY: Record<string, { displayName: string; filename: string }> = {
  'vintage-cube': {
    displayName: 'MTGO Vintage Cube (Nov 2024)',
    filename: 'mtgo-vintage-cube-nov-2024.json',
  },
}
const DEFAULT_LIST_ID = 'vintage-cube'

const loadedLists = new Map<string, CardEntry[]>()
for (const [id, { filename }] of Object.entries(LIST_REGISTRY)) {
  const file = Bun.file(`./cardlists/${filename}`)
  loadedLists.set(id, await file.json())
}
```

`Bun.file(...).json()` parses the JSON array directly — no `.text()` + `.split('\n')`.
All lists are available before the server begins accepting connections. Additional lists
are registered by adding an entry to `LIST_REGISTRY` and placing the JSON file in
`cardlists/`.

### 2. `getRandomCards()` (currently `index.ts:20-29`)

Signature changes from `(requiredNum: number, names: string[])` to
`(requiredNum: number, entries: CardEntry[]): CardEntry[]`. Deduplication uses a `Map`
keyed on `entry.name` to preserve full entry objects:

```ts
function getRandomCards(requiredNum: number, entries: CardEntry[]): CardEntry[] {
  const chosen = new Map<string, CardEntry>()
  while (chosen.size < requiredNum) {
    const randomIndex = Math.floor(Math.random() * entries.length)
    const entry = entries[randomIndex]
    chosen.set(entry.name, entry)
  }
  return [...chosen.values()]
}
```

### 3. `createNewGame()` (currently `index.ts:33-93`)

Gains a `listId: string` parameter. The entry list resolves from `loadedLists`; the card
loop and `BoardSpace` literal change as follows:

- Line 35 (`getRandomCards(25, cardnamesArray)`) becomes
  `getRandomCards(25, loadedLists.get(listId)!)`. The `!` is safe because the caller has
  already validated `listId` against the registry.
- The `for...of` loop iterates `CardEntry` objects. `card.name` replaces `card` as the
  word source.
- The `BoardSpace` literal (`index.ts:68-72`) gains `imageUrl`:

```ts
const space: BoardSpace = {
  word: card.name,
  identity,
  flipped: false,
  imageUrl: card.imageUrl,
}
```

No other changes inside `createNewGame()`.

### 4. `createNewGame` action handler (currently `index.ts:282-286`)

```ts
if (action === 'createNewGame') {
  const listId: string = parsedMsg.listId ?? DEFAULT_LIST_ID
  if (parsedMsg.listId !== undefined && !LIST_REGISTRY[listId]) {
    console.error(`createNewGame: unknown listId "${listId}"`)
    return
  }
  if (!parsedMsg.listId) {
    console.warn(`createNewGame: no listId supplied, falling back to "${DEFAULT_LIST_ID}"`)
  }
  createNewGame(listId)
  console.log('a new game has been created')
  server.publish('game', JSON.stringify(state))
}
```

The `server.publish` call is unchanged.

## Frontend changes — `client/`

### `client/src/lib/gameState.svelte.ts` (line 63-67)

`createNewGame` gains a `listId` parameter:

```ts
export function createNewGame(listId: string) {
  const wsConnection = getWsConnection()
  if (!wsConnection) return
  wsConnection.send(JSON.stringify({ action: 'createNewGame', listId }))
}
```

### `client/src/routes/+page.svelte`

1. **Add `LIST_OPTIONS` and `selectedListId`** to the `<script>` block. This mirrors
   `LIST_REGISTRY` as a client-side literal (decision 6):

```ts
const LIST_OPTIONS = [
  { id: 'vintage-cube', label: 'MTGO Vintage Cube (Nov 2024)' },
] satisfies { id: string; label: string }[]

let selectedListId = $state(LIST_OPTIONS[0].id)
```

2. **Add a `<select>` dropdown** in the `{#if gameState.game === null || isGameOver()}`
   branch (currently lines 24-33), adjacent to the "Create game" button:

```svelte
<select bind:value={selectedListId}>
  {#each LIST_OPTIONS as opt (opt.id)}
    <option value={opt.id}>{opt.label}</option>
  {/each}
</select>
<button onclick={createNewGameAndEnter}>Create game</button>
```

3. **Update `createNewGameAndEnter`** (line 17-20) to forward the selection:

```ts
async function createNewGameAndEnter() {
  createNewGame(selectedListId)
  await enterGame()
}
```

The import on line 2 (`import { gameState, createNewGame, isGameOver } from
'$lib/gameState.svelte'`) is unchanged — only the call site gains the argument.

No other client files change for this spec. How `imageUrl` is rendered on the board is
deferred to `specs/card-image-view.md` (issue #18).

## Relationship to other specs

- **`specs/card-image-view.md` (future, issue #18):** that spec will consume
  `BoardSpace.imageUrl` to render card images in `board.svelte` and related components.
  This spec only establishes the field and guarantees it is present on every `BoardSpace`;
  all rendering decisions are out of scope here.
- **`specs/multi-room.md`:** when rooms land, `createRoom`/`createNewGame` per-room will
  naturally carry `listId` — one extra field on a message already being extended. Nothing
  in this spec conflicts with that refactor.
- **Issue #16 (backend validation/Zod):** `parsedMsg.listId` is exactly the kind of
  incoming client string that Zod adoption would validate declaratively. For now the
  registry lookup is the validator (consistent with today's hand-rolled style); the
  field's name and type (`string | undefined`) are chosen to be trivially Zod-schemable
  later.
- **`specs/players-teams-roles.md`:** no interaction. `imageUrl` on `BoardSpace` is
  equally visible to spymasters and operatives (decision 10) and does not touch the
  redaction model that spec introduces via ADR 0001.

## Out of scope

- **User-pasted or user-uploaded custom lists.** Only files registered in `LIST_REGISTRY`
  are accessible; there is no mechanism for clients to supply an arbitrary filename or
  JSON blob.
- **Auto-discovery of list files from `cardlists/`.** The directory is not scanned at
  startup; new files must be explicitly added to `LIST_REGISTRY`.
- **Runtime Scryfall API calls.** `imageUrl` values are populated offline at
  list-authoring time and stored in the JSON file. The server never contacts Scryfall
  during `createNewGame()` or at any other time.
- **A "list available lists" message from server to client.** The client hardcodes the
  same values (decision 6). A future spec could add a `listRegistry` field on the initial
  `login` response if dynamic discovery becomes desirable.
- **Client-side image rendering.** `imageUrl` is now on every `BoardSpace` the client
  receives, but when and how images are shown on the board is entirely deferred to
  `specs/card-image-view.md`.
- **Redaction of `imageUrl`.** Image URLs do not reveal card identity and require no
  per-role filtering (decision 10).
- **Migrating the existing `.txt` file.** Converting `mtgo-vintage-cube-nov-2024.txt` to
  `.json` with real Scryfall URLs is a list-authoring task, not a code task. Until the
  migrated file exists, development can use a short hand-crafted fixture (see
  Verification below).

## Verification

1. **Create a fixture list.** Write a minimal `cardlists/mtgo-vintage-cube-nov-2024.json`
   with 30+ entries of the shape `{ "name": "Benevolent Bodyguard", "imageUrl":
   "https://cards.scryfall.io/normal/front/..." }` (real or placeholder URLs). Register
   it as `'vintage-cube'` in `LIST_REGISTRY`.

2. **Optionally register a second list** (`'sample-cube'`, pointing at a second fixture
   JSON file) to exercise the multi-list path end-to-end.

3. **Run backend and client:** `bun run index.ts` (port 3000); `cd client && vite dev`.
   Confirm no startup errors (all registered files load successfully).

4. **Dropdown appears:** on the home page, confirm the `<select>` element lists each
   registered list by display name. If only one list is registered, the dropdown still
   renders (with one option).

5. **Create a game with each list:** select each option in turn, click "Create game",
   navigate to the board. Inspect `gameState.game.board` in the browser — confirm (a) card
   words come from the chosen list's entries and (b) each `BoardSpace` has a non-empty
   `imageUrl` string.

6. **Reject invalid `listId`:** send `{"action":"createNewGame","listId":"not-a-real-list"}`
   directly via WebSocket. Confirm the server logs `console.error` and does **not**
   broadcast a new game state. Confirm the server does not crash.

7. **Backward-compat default:** send `{"action":"createNewGame"}` (no `listId`). Confirm
   the server logs `console.warn`, falls back to `DEFAULT_LIST_ID`, and creates a valid
   game using that list.

8. `cd client && bun run check` — no TypeScript errors on the updated `BoardSpace`
   interface or the updated `createNewGame(listId: string)` call signature.
