import { Observable } from "@babylonjs/core";

export type CanionState = "searching" | "alert" | "destroyed";

export class CanionStateMachine {

  private state:           CanionState = "searching";
  private stateObservable  = new Observable<CanionState>();

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  setState(next: CanionState): void {
    if (this.state === next) return;
    this.state = next;
    this.stateObservable.notifyObservers(next);
  }

  getState(): CanionState {
    return this.state;
  }

  isDestroyed(): boolean {
    return this.state === "destroyed";
  }

  onStateChange(cb: (state: CanionState) => void): void {
    this.stateObservable.add(cb);
  }
}