import { getOpposingTeam } from './shared/getOpposingTeam'
import {
  GameState,
  BoardSpace,
  GameBaseState,
  CardIdentity,
} from './shared/types'

const state: GameState = {
  game: null,
}

const cardnameFiles = Bun.file('./cardlists/mtgo-vintage-cube-nov-2024.txt')
const text = await cardnameFiles.text()
const cardnamesArray = text.trim().split('\n')

/**
 * Takes an array of card names and returns 25 at random
 */
function getRandomCards(requiredNum: number, names: string[]) {
  const cardnames = new Set<string>()

  while (cardnames.size < requiredNum) {
    const randomIndex = Math.floor(Math.random() * names.length)
    cardnames.add(names[randomIndex])
  }

  return [...cardnames]
}

const possibleTeams = ['mirran', 'phyrexian'] as const

function createNewGame() {
  const board: BoardSpace[][] = [[], [], [], [], []]
  const cards = getRandomCards(25, cardnamesArray)
  const currentTurn = possibleTeams[Math.floor(Math.random() * 2)]

  const mirranCards = currentTurn === 'mirran' ? 9 : 8
  const phyrexianCards = currentTurn === 'phyrexian' ? 9 : 8

  const cardsByIdentity = {
    mirran: mirranCards,
    phyrexian: phyrexianCards,
    neutral: 7,
    assassin: 1,
  }

  const availableIdentities: CardIdentity[] = [
    'mirran',
    'phyrexian',
    'neutral',
    'assassin',
  ]

  let row = 0

  for (const card of cards) {
    const identity =
      availableIdentities[
        Math.floor(Math.random() * availableIdentities.length)
      ]

    cardsByIdentity[identity] -= 1
    if (cardsByIdentity[identity] < 1) {
      availableIdentities.splice(availableIdentities.indexOf(identity), 1)
    }

    const space: BoardSpace = {
      word: card,
      identity,
      flipped: false,
    }

    board[row].push(space)
    if (board[row].length === 5) {
      row++
    }
  }

  const game: GameBaseState = {
    board,
    currentTurn,
    cardsRemaining: {
      mirran: mirranCards,
      phyrexian: phyrexianCards,
    },
    details: {
      status: 'gameReady',
      team: currentTurn,
    },
  }
  state.game = game
}

function startGame() {
  if (!state.game) {
    console.error('A game start was triggered before a game was created')
    return
  }
  state.game.details = {
    status: 'gameStarted',
    team: state.game.currentTurn,
  }
}

// how to handle errors?
function guessCard(position: [number, number], name: string) {
  if (!state.game) {
    console.error('A card was guessed when there was no game')
    return
  }
  if (!('clue' in state.game.details)) {
    console.error('A card was guessed when there was no clue')
    return
  }
  const targetCard = state.game.board[position[0]][position[1]]
  if (targetCard.word !== name) {
    console.error('The card guessed was not the card at the position given')
    return
  }
  if (targetCard.flipped) {
    console.error('The chosen card has already been chosen previously')
    return
  }

  const currentTeam = state.game.currentTurn
  const opposingTeam = getOpposingTeam(currentTeam)
  targetCard.flipped = true

  if (targetCard.identity === 'assassin') {
    console.log(
      `The assassin was chosen, ${state.game.currentTurn} has lost the game`
    )

    state.game.details = {
      status: 'gameOverAssassin',
      team: currentTeam,
    }
    return
  }

  if (targetCard.identity === currentTeam) {
    state.game.cardsRemaining[currentTeam] -= 1
    const guessesRemaining = state.game.details.guessesRemaining - 1

    if (state.game.cardsRemaining[currentTeam] === 0) {
      state.game.details = {
        status: 'gameOverOperatives',
        team: currentTeam,
      }
      return
    }

    if (guessesRemaining - 1 === 0) {
      state.game.details = {
        status: 'correctGuessLimitReached',
        team: currentTeam,
      }
      state.game.currentTurn = opposingTeam
      return
    }

    state.game.details = {
      status: 'correctGuess',
      team: currentTeam,
      clue: state.game.details.clue,
      guessesRemaining,
    }
    return
  }

  if (targetCard.identity === 'neutral') {
    state.game.details = {
      status: 'incorrectGuess',
      team: currentTeam,
      identityPicked: 'neutral',
    }
    state.game.currentTurn = opposingTeam
    return
  }

  if (targetCard.identity === opposingTeam) {
    state.game.details = {
      status: 'incorrectGuess',
      team: currentTeam,
      identityPicked: opposingTeam,
    }
    state.game.currentTurn = opposingTeam
    state.game.cardsRemaining[opposingTeam] -= 1
    return
  }
}

function handleClueSubmission(clue: { word: string; number: string }) {
  if (!state.game) {
    console.error('A clue was submitted when there was no game')
    return
  }

  if (clue.word === '' || clue.number === null) {
    console.error('A clue was submitted without a word or number')
    return
  }

  let guessesRemaining = parseInt(clue.number, 10) + 1

  if (clue.number === '0' || clue.number === '∞') {
    guessesRemaining = 999
  }

  state.game.details = {
    status: 'clueGiven',
    clue,
    guessesRemaining,
    team: state.game.currentTurn,
  }
}

function handlePassTurn() {
  if (!state.game) {
    console.error('Someone tried to pass the turn with no game in progress')
    return
  }

  state.game.details = {
    status: 'turnPassed',
    team: state.game.currentTurn,
  }

  state.game.currentTurn = getOpposingTeam(state.game.currentTurn)
}

function getCurrentGameState() {
  return state.game
}

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const success = server.upgrade(req)
    if (success) {
      return undefined
    }

    return new Response('hi')
  },
  websocket: {
    open(socket) {
      console.log('connection opened')
      socket.subscribe('game')
    },
    close(socket) {
      console.log('a connection was closed')
      socket.unsubscribe('game')
    },
    async message(socket, message) {
      if (typeof message !== 'string') {
        console.log('server only accepts strings')
        return
      }

      try {
        const parsedMsg = JSON.parse(message)
        const { action } = parsedMsg
        const gameState = getCurrentGameState()

        if (action === 'login') {
          console.log(
            `a client has connected - random UUID: ${crypto.randomUUID()}`
          )
          socket.send(JSON.stringify(state))
        }

        if (action === 'createNewGame') {
          createNewGame()
          console.log('a new game has been created')
          server.publish('game', JSON.stringify(state))
        }

        if (action === 'startGame') {
          startGame()
          console.log('a game has been started')
          server.publish('game', JSON.stringify(state))
        }

        if (action === 'submitClue') {
          handleClueSubmission(parsedMsg.clue)
          console.log(
            `a clue has been received: ${parsedMsg.clue.word} ${parsedMsg.clue.number}`
          )
          server.publish('game', JSON.stringify(state))
        }

        if (action === 'passTurn') {
          handlePassTurn()
          console.log('the turn was passed')
          server.publish('game', JSON.stringify(state))
        }

        if (action === 'guessCard') {
          if (!gameState) {
            console.error('guess action was received when there was no game')
            return
          }

          guessCard(parsedMsg.position, parsedMsg.name)
          server.publish('game', JSON.stringify(state))
        }
      } catch (err) {
        console.error(err)
      }
    },
  },
})
