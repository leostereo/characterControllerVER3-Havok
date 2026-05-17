// src/enemies/base/BaseStateMachine.ts

import { Observable } from "@babylonjs/core";
import type { IBaseStateMachine } from "../interfaces";

export abstract class BaseStateMachine<TState extends string>
  implements IBaseStateMachine<TState> {

  protected state!: TState;
  private stateObservable = new Observable<TState>();

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  setState(next: TState): void {
    if (this.state === next) return;
    const prev = this.state;
    this.state = next;
    this.onExit(prev);
    this.onEnter(next);
    this.stateObservable.notifyObservers(next);
  }

  getState(): TState { return this.state; }

  onStateChange(cb: (state: TState) => void): void {
    this.stateObservable.add(cb);
  }

  // ─────────────────────────────────────────────
  //  CONTRATO INTERNO
  // ─────────────────────────────────────────────
  protected abstract onEnter(state: TState): void;
  protected abstract onExit(state: TState): void;
  abstract dispose(): void;
}