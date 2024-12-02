import { GameState } from '..'

const ws = new WebSocket('ws://localhost:3000')

ws.onopen = () => {
  console.log('connected to server')
  const username = prompt('What is your username?')
  const loginRequestMessage = {
    action: 'login',
    username,
  }
  ws.send(JSON.stringify(loginRequestMessage))
}

function isGameState(jsonParsed: any): jsonParsed is GameState {
  return jsonParsed.game !== undefined
}

ws.onmessage = (event) => {
  if (typeof event.data !== 'string') {
    console.log('received an unexpected Buffer')
    return
  }

  if (event.data === 'GAME_CREATED') {
    const startGame = confirm(
      'A new game was successfully created. Would you like to start?'
    )
    if (startGame) {
      ws.send(JSON.stringify({ action: 'startGame' }))
    }
    return
  }

  if (event.data === 'GAME_STARTED') {
    console.log('The game has started')
    return
  }

  // TODO: validate with a package like zod?
  const message = JSON.parse(event.data)

  if (isGameState(message)) {
    if (message.game === null) {
      const createNewGame = confirm(
        'There is no game currently in progress. Would you like to create a new game?'
      )

      if (createNewGame) {
        ws.send(JSON.stringify({ action: 'createNewGame' }))
      }
      return
    }

    if (message.game.status === 'ready') {
      const startGame = confirm('There is a game. Would you like to begin?')
      if (startGame) {
        ws.send(JSON.stringify({ action: 'startGame ' }))
      }
      return
    }
  }
}

ws.onclose = (event) => {
  console.log('connection to server closed')
}
