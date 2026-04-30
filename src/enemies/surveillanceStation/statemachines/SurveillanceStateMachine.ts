import { Observable } from "@babylonjs/core";
import { EventManager }  from "@/game/eventManager/eventManager";
import { meshMetadata }  from "@/config/GameConfig";

export type SurveillanceState = "searching" | "alert" | "collapsed";

export class SurveillanceStateMachine {

  private state           = "searching" as SurveillanceState;
  private stateObservable = new Observable<SurveillanceState>();
  private eventManager    = EventManager.getInstance();

  constructor(private uniqueId: string) {
    this.subscribeToHit();
  }

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  setState(next: SurveillanceState): void {
    if (this.state === next) return;
    this.state = next;
    this.stateObservable.notifyObservers(next);
  }

  getState(): SurveillanceState { return this.state; }
  isCollapsed(): boolean        { return this.state === "collapsed"; }

  onStateChange(cb: (state: SurveillanceState) => void): void {
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
      if (data.stationId  !== this.uniqueId) return;

      this.eventManager.unsubscribe(observer);
      this.setState("collapsed");
    });
  }
}