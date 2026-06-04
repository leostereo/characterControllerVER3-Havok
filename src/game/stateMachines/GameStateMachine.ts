import { GameState } from "../types/GameState";

const VALID_TRANSITIONS: Record<GameState, GameState[]> = {
  [GameState.LOADING]:   [GameState.READY],
  [GameState.READY]:     [GameState.PLAYING],
  [GameState.PLAYING]:   [GameState.PAUSED, GameState.GAME_OVER, GameState.WIN], // ← WIN
  [GameState.PAUSED]:    [GameState.PLAYING],
  [GameState.GAME_OVER]: [GameState.LOADING],
  [GameState.WIN]:       [GameState.LOADING],  // ← nuevo
};

export class GameStateMachine {
  private _current: GameState = GameState.LOADING;
  private _handlers = new Map<GameState, () => void>();

  get current(): GameState { return this._current; }
  is(state: GameState): boolean { return this._current === state; }

  onEnter(state: GameState, handler: () => void): void {
    this._handlers.set(state, handler);
  }

  reset(): void {
    this._current = GameState.LOADING;
  }

  transition(next: GameState): boolean {
    if (!VALID_TRANSITIONS[this._current].includes(next)) {
      console.warn(`[StateMachine] Transición inválida: ${this._current} → ${next}`);
      return false;
    }
    console.warn(`[StateMachine] ${this._current} → ${next}`);
    this._current = next;
    this._handlers.get(next)?.();
    return true;
  }
}