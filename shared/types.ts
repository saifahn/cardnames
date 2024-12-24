interface NoGameState {
  game: null
}

export type Team = 'mirran' | 'phyrexian'

export type CardIdentity = Team | 'assassin' | 'neutral'

export interface BoardSpace {
  word: string
  identity: CardIdentity
  flipped: boolean
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

type GameOverAssassinStatus = {
  status: 'gameOverAssassin'
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

type Details =
  | GameStartedStatus
  | ClueGivenStatus
  | CorrectGuessStatus
  | GuessLimitReachedStatus
  | IncorrectGuessStatus
  | GameOverAssassinStatus
  | GameOverOperativesStatus
  | TurnPassedStatus

export interface GameBaseState {
  board: BoardSpace[][]
  goesFirst: Team
  currentTurn: Team
  status: 'ready' | 'inProgress' | 'finished'
  clue: {
    word: string
    number: string | null
  }
  guessesRemaining: number
  cardsRemaining: {
    [key in Team]: number
  }
  details: Details
  // add logged in users and users by team
}

export type GameState = NoGameState | { game: GameBaseState }
