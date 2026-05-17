// src/enemies/interfaces/IBaseStateMachine.ts

export interface IBaseStateMachine<TState extends string> {
  setState(next: TState): void;
  getState(): TState;
  onStateChange(cb: (state: TState) => void): void;
  dispose(): void;
}