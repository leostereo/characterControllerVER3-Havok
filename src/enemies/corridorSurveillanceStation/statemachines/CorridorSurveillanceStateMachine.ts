import { Observable } from "@babylonjs/core";
import { EventManager } from "@/game/eventManager/eventManager";
import { meshMetadata } from "@/config/GameConfig";

export type CorridorSurveillanceState = "searching" | "alert" | "collapsed";

export class CorridorSurveillanceStateMachine {

  private state = "searching" as CorridorSurveillanceState;
  private stateObservable = new Observable<CorridorSurveillanceState>();
  private eventManager = EventManager.getInstance();

  constructor(private uniqueId: string) {
    this.subscribeToHit();
  }

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  setState(next: CorridorSurveillanceState): void {
    if (this.state === next) return;
    this.state = next;
    this.stateObservable.notifyObservers(next);
  }

  getState(): CorridorSurveillanceState { return this.state; }
  isCollapsed(): boolean { return this.state === "collapsed"; }

  onStateChange(cb: (state: CorridorSurveillanceState) => void): void {
    this.stateObservable.add(cb);
  }

  // ─────────────────────────────────────────────
  //  SUSCRIPCIÓN AL EVENTO — vive en la state machine
  // ─────────────────────────────────────────────
  private subscribeToHit(): void {
    const observer = this.eventManager.subscribe((event) => {
      if (this.isCollapsed()) return;
      if (event.type !== "enemy_damaged") return;

      const data = event.data as { enemyClass: string; stationId: string };
      if (data.enemyClass !== meshMetadata.enemyClasses.surveillance) return;
      if (data.stationId !== this.uniqueId) return;

      this.eventManager.unsubscribe(observer);
      this.setState("collapsed");
    });
  }
}