import { PUBLIC_BACKEND_URL } from '$env/static/public';
import type { GameState } from '../../../shared/types';

let wsConnection: WebSocket | undefined = $state();
export const gameState: GameState = $state({ game: null });

function isGameState(jsonParsed: unknown): jsonParsed is GameState {
  if (!(typeof jsonParsed === 'object' && !!jsonParsed && 'game' in jsonParsed)) {
    return false;
  }
  return jsonParsed.game !== undefined;
}

export function wsConnect() {
  if (wsConnection) {
    console.log('connection already exists, skipping');
    return;
  }
  wsConnection = new WebSocket(PUBLIC_BACKEND_URL);

  wsConnection.onopen = () => {
    console.log('connected to server');
    const loginRequestMessage = {
      action: 'login',
      username: 'svelteKit'
    };
    wsConnection!.send(JSON.stringify(loginRequestMessage));
  };

  wsConnection.onmessage = (event) => {
    if (typeof event.data !== 'string') {
      console.log('received an unexpected Buffer');
      return;
    }

    const message = JSON.parse(event.data);

    if (isGameState(message)) {
      // TODO: add different messages on each guess for more information
      gameState.game = message.game;
    }
  };

  wsConnection.onclose = () => {
    console.log('connection to server closed');
  };
}

function getWsConnection() {
  if (!wsConnection) {
    wsConnect();
  }
  return wsConnection;
}

export function createNewGame() {
  const wsConnection = getWsConnection();
  if (!wsConnection) return;
  wsConnection.send(JSON.stringify({ action: 'createNewGame' }));
}

export function startGame() {
  const wsConnection = getWsConnection();
  if (!wsConnection) return;
  wsConnection.send(JSON.stringify({ action: 'startGame' }));
}

export function passTurn() {
  const wsConnection = getWsConnection();
  if (!wsConnection) return;
  wsConnection.send(JSON.stringify({ action: 'passTurn' }));
}

export function submitClue(word: string, number: string) {
  const wsConnection = getWsConnection();
  if (!wsConnection) return;
  wsConnection.send(
    JSON.stringify({
      action: 'submitClue',
      clue: {
        word,
        number
      }
    })
  );
}

export function guessCard(position: [number, number], name: string) {
  const wsConnection = getWsConnection();
  if (!wsConnection) return;
  wsConnection.send(JSON.stringify({ action: 'guessCard', position, name }));
}
