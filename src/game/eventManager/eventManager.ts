import { Observable, type Observer } from "@babylonjs/core";

export type EventType = 
  | "player_damaged"
  | "player_died"
  | "enemy_damaged"
  | "enemy_died"
  | "projectile_hit"
  | "projectile_fired"
  | "game_over"
  | "game_won";

export type SourceType = 
| "enemy"
| "player"
| "other"

export interface GameEvent {
  type: EventType;
  source?: string; // ej: "player", "enemy_1"
  sourceType : SourceType;
  data?: object;
}

export class EventManager {
  private static instance: EventManager;
  private eventObservable = new Observable<GameEvent>();

  private constructor() {}

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  emit(event: GameEvent): void {
    this.eventObservable.notifyObservers(event);
  }

  subscribe(callback: (event: GameEvent) => void): Observer<GameEvent> {
    return this.eventObservable.add(callback);
  }

  unsubscribe(observer: Observer<GameEvent>): void {
    this.eventObservable.remove(observer);
  }
}