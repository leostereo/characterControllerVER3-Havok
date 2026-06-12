// src/enemies/cyborgV1/CyborgFSM.ts

import { BaseStateMachine, type TransitionTable } from "../abstract/BaseStateMachine";
import { type ICyborgStateMachine } from "../interfaces/ICyborgStateMachine";

export type CyborgState =
  | "patrolling"
  | "shooting"
  | "searching"
  | "intensiveSearch"
  | "hit_reaction"
  | "defeated"
  | "paused";

export class CyborgFSM extends BaseStateMachine<CyborgState>
  implements ICyborgStateMachine {

  private previousState: CyborgState = "patrolling";
  private health        = 3;
  private intensiveSearchTimer  = 0;
  private intensiveSearchTimeout = 5000; // ← vendrá de gameConfig.cyborg

  // ─────────────────────────────────────────────
  //  TABLA DE TRANSICIONES
  // ─────────────────────────────────────────────
  protected transitions: TransitionTable<CyborgState> = {
    patrolling: {
      shooting:        true,
      searching:       true,
      hit_reaction:    true,
      defeated:        true,
      paused:          true,
    },
    shooting: {
      searching:       true,
      hit_reaction:    true,
      defeated:        true,
      paused:          true,
    },
    searching: {
      shooting:        true,
      intensiveSearch: true,
      hit_reaction:    true,
      defeated:        true,
      paused:          true,
    },
    intensiveSearch: {
      shooting:        true,
      patrolling:      true,
      hit_reaction:    true,
      defeated:        true,
      paused:          true,
    },
    hit_reaction: {
      // bloqueante — sin transiciones externas
    },
    defeated: {
      // bloqueante terminal — sin transiciones
    },
    paused: {
      hit_reaction:    true,
      patrolling:      true,  // ← al reanudar, el controller decide
    },
  };

  constructor() {
    super();
    this.state = "patrolling";
  }

  // ─────────────────────────────────────────────
  //  HOOKS
  // ─────────────────────────────────────────────
  protected onEnter(state: CyborgState): void {
    switch (state) {
      case "hit_reaction":
        this._isBlocking  = true;
        this.health      -= 1;
        break;
      case "defeated":
        this._isBlocking  = true;
        break;
      case "intensiveSearch":
        this.intensiveSearchTimer = 0;
        break;
    }
  }

  protected onExit(state: CyborgState): void {
    switch (state) {
      case "hit_reaction":
        this._isBlocking = false;
        break;
      case "paused":
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
    if (this.health <= 0) {
      this._isBlocking = false;  // desbloquear para permitir transición
      this.setState("defeated");
    } else {
      this._isBlocking = false;
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

  isDefeated():  boolean { return this.state === "defeated"; }
  isPaused():    boolean { return this.state === "paused"; }
  getHealth():   number  { return this.health; }

  dispose(): void {}
}