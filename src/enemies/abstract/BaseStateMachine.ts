// src/enemies/abstract/BaseStateMachine.ts

import { Observable } from "@babylonjs/core";
import type { IBaseStateMachine } from "../interfaces";

export type TransitionGuard = () => boolean;
export type TransitionTable<TState extends string> = 
  Partial<Record<TState, Partial<Record<TState, TransitionGuard | true>>>>;

export abstract class BaseStateMachine<TState extends string>
  implements IBaseStateMachine<TState> {

  protected state!:       TState;
  protected _isBlocking = false;
  private stateObservable = new Observable<TState>();

  // ─────────────────────────────────────────────
  //  TABLA DE TRANSICIONES — cada subclase define la suya
  // ─────────────────────────────────────────────
  protected abstract transitions: TransitionTable<TState>;

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  setState(next: TState): void {
    if (this._isBlocking) return;
    if (!this.isValidTransition(next)) return;

    const prev  = this.state;
    this.state  = next;
    this.onExit(prev);
    this.onEnter(next);
    this.stateObservable.notifyObservers(next);
  }

  getState(): TState { return this.state; }

  isBlocking(): boolean { return this._isBlocking; }

  onStateChange(cb: (state: TState) => void): void {
    this.stateObservable.add(cb);
  }

  // ─────────────────────────────────────────────
  //  CONTRATO INTERNO
  // ─────────────────────────────────────────────
  protected abstract onEnter(state: TState): void;
  protected abstract onExit(state:  TState): void;
  abstract dispose(): void;

  // ─────────────────────────────────────────────
  //  VALIDACIÓN DE TRANSICIÓN
  // ─────────────────────────────────────────────
  private isValidTransition(next: TState): boolean {
    const stateTransitions = this.transitions[this.state];
    if (!stateTransitions) return false;

    const guard = stateTransitions[next];
    if (guard === undefined) return false;
    if (guard === true)      return true;
    return guard();
  }
}