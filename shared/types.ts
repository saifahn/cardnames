interface NoGameState {
  game: null
}

export type Team = 'mirran' | 'phyrexian'

export type CardIdentity = Team | 'emrakul' | 'neutral'

export interface BoardSpace {
  word: string
  identity: CardIdentity
  flipped: boolean
}

type GameReadyStatus = {
  status: 'gameReady'
  team: Team
}

type GameStartedStatus = {
  status: 'gameStarted'
  team: Team
}

type ClueStatusBase = {
  clue: {
    word: string
    number: string | null
  }
  guessesRemaining: number
  team: Team
}

type ClueGivenStatus = ClueStatusBase & {
  status: 'clueGiven'
}

type CorrectGuessStatus = ClueStatusBase & {
  status: 'correctGuess'
}

type GuessLimitReachedStatus = {
  status: 'correctGuessLimitReached'
  team: Team
}

type IncorrectGuessStatus = {
  status: 'incorrectGuess'
  identityPicked: 'neutral' | Team
  team: Team
}

type GameOverEmrakulStatus = {
  status: 'gameOverEmrakul'
  team: Team
}

type GameOverOperativesStatus = {
  status: 'gameOverOperatives'
  team: Team
}

type TurnPassedStatus = {
  status: 'turnPassed'
  team: Team
}

type CluePresentStatus = ClueGivenStatus | CorrectGuessStatus

export type Details =
  | GameReadyStatus
  | GameStartedStatus
  | ClueGivenStatus
  | CorrectGuessStatus
  | GuessLimitReachedStatus
  | IncorrectGuessStatus
  | GameOverEmrakulStatus
  | GameOverOperativesStatus
  | TurnPassedStatus

export interface GameBaseState {
  board: BoardSpace[][]
  currentTurn: Team
  cardsRemaining: {
    [key in Team]: number
  }
  details: Details
  // add logged in users and users by team
}

export type GameState = NoGameState | { game: GameBaseState }

export function detailsHaveClue(
  details: Details | undefined
): details is CluePresentStatus {
  return !!details && 'clue' in details
}
