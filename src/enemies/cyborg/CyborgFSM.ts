// src/enemies/cyborgV1/CyborgFSM.ts

import { BaseStateMachine, type TransitionTable } from "../abstract/BaseStateMachine";
import { type ICyborgStateMachine } from "../interfaces/ICyborgStateMachine";

export type CyborgState =
  | "patrolling"
  | "shooting"
  | "searching"
  | "intensiveSearch"
  | "hit_reaction_back"      // ← impacto desde adelante
  | "hit_reaction_forward"   // ← impacto desde atrás
  | "hit_reaction_left"      // ← impacto desde la derecha
  | "hit_reaction_right"     // ← impacto desde la izquierda
  | "hit_reaction"
  | "defeated"
  | "paused";

export class CyborgFSM extends BaseStateMachine<CyborgState>
  implements ICyborgStateMachine {

  private previousState: CyborgState = "patrolling";
  private health = 3;
  private intensiveSearchTimer = 0;
  private intensiveSearchTimeout = 5000; // ← vendrá de gameConfig.cyborg

  // ─────────────────────────────────────────────
  //  TABLA DE TRANSICIONES
  // ─────────────────────────────────────────────
  protected transitions: TransitionTable<CyborgState> = {
    patrolling: {
      shooting: true,
      searching: true,
      hit_reaction_back: true,
      hit_reaction_forward: true,
      hit_reaction_left: true,
      hit_reaction_right: true,
      defeated: true,
      paused: true,
    },
    shooting: {
      searching: true,
      hit_reaction_back: true,
      hit_reaction_forward: true,
      hit_reaction_left: true,
      hit_reaction_right: true,
      defeated: true,
      paused: true,
    },
    searching: {
      shooting: true,
      intensiveSearch: true,
      hit_reaction_back: true,
      hit_reaction_forward: true,
      hit_reaction_left: true,
      hit_reaction_right: true,
      defeated: true,
      paused: true,
    },
    intensiveSearch: {
      shooting: true,
      patrolling: true,
      hit_reaction_back: true,
      hit_reaction_forward: true,
      hit_reaction_left: true,
      hit_reaction_right: true,
      defeated: true,
      paused: true,
    },
    hit_reaction_back: {
      defeated: true,
      patrolling: true,
      shooting: true,
      searching: true,
      intensiveSearch: true,
    },
    hit_reaction_forward: {
      defeated: true,
      patrolling: true,
      shooting: true,
      searching: true,
      intensiveSearch: true,
    },
    hit_reaction_left: {
      defeated: true,
      patrolling: true,
      shooting: true,
      searching: true,
      intensiveSearch: true,
    },
    hit_reaction_right: {
      defeated: true,
      patrolling: true,
      shooting: true,
      searching: true,
      intensiveSearch: true,
    },
    defeated: {
      // bloqueante terminal — sin transiciones
    },
    paused: { hit_reaction_back: true, hit_reaction_forward: true, hit_reaction_left: true, hit_reaction_right: true, patrolling: true },
  };

  constructor() {
    super();
    this.state = "paused";
  }

  // ─────────────────────────────────────────────
  //  HOOKS
  // ─────────────────────────────────────────────
  protected onEnter(state: CyborgState): void {
    switch (state) {
      case "hit_reaction_back":
      case "hit_reaction_forward":
      case "hit_reaction_left":
      case "hit_reaction_right":
      case "defeated":
        this._isBlocking = true;
        this.health -= 1;
        break;
      case "intensiveSearch":
        this.intensiveSearchTimer = 0;
        break;
    }
  }

  protected onExit(state: CyborgState): void {
    switch (state) {
      case "hit_reaction_back":
      case "hit_reaction_forward":
      case "hit_reaction_left":
      case "hit_reaction_right":
        this._isBlocking = false;
        break;
    }
  }

  // ─────────────────────────────────────────────
  //  TICK — llamado por CyborgController
  // ─────────────────────────────────────────────
  tick(dt: number): void {
    if (this.state === "intensiveSearch") {
      this.intensiveSearchTimer += dt;
      if (this.intensiveSearchTimer >= this.intensiveSearchTimeout) {
        this.setState("patrolling");
      }
    }
  }

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────

  // llamado por CyborgBody cuando termina la animación de hit_reaction
  onHitReactionEnded(): void {
    this._isBlocking = false;
    if (this.health <= 0) {
      this.setState("defeated");
    } else {
      this.setState(this.previousState);
    }
  }

  // llamado por CyborgBody cuando termina la animación de defeated
  onDefeatedAnimationEnded(): void {
    // la física toma el control — no hay más transiciones
    // CyborgMain escucha esto para activar ragdoll
  }

  savePreviousState(): void {
    if (this.state !== "hit_reaction" && this.state !== "defeated") {
      this.previousState = this.state;
    }
  }

  isDefeated(): boolean { return this.state === "defeated"; }
  isPaused(): boolean { return this.state === "paused"; }
  getHealth(): number { return this.health; }

  dispose(): void { }
}