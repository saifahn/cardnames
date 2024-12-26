import { PUBLIC_BACKEND_URL } from '$env/static/public';
import type { Details, GameState } from '../../../shared/types';

let isWSConnected = $state(false);
let isGameStateLoaded = $state(false);

export const getWSConnectedStatus = () => isWSConnected;
export const getGameStateLoadedStatus = () => isGameStateLoaded;

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
      username: 'cardnamesClient'
    };
    wsConnection!.send(JSON.stringify(loginRequestMessage));
    isWSConnected = true;
  };

  wsConnection.onmessage = (event) => {
    if (typeof event.data !== 'string') {
      console.log('received an unexpected Buffer');
      return;
    }

    const message = JSON.parse(event.data);

    if (isGameState(message)) {
      gameState.game = message.game;
      isGameStateLoaded = true;
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

export function isWaitingForClue(gameDetails: Details) {
  return (
    gameDetails.status === 'gameStarted' ||
    gameDetails.status === 'correctGuessLimitReached' ||
    gameDetails.status === 'incorrectGuess' ||
    gameDetails.status === 'turnPassed'
  );
}
