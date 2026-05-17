// src/enemies/sentinelV1/SentinelFSM.ts

import { BaseStateMachine } from "../abstract/BaseStateMachine";

export type SentinelState =
  | "patrolling"
  | "shooting"
  | "searching"
  | "intensiveSearch";

export class SentinelFSM extends BaseStateMachine<SentinelState> {

  private intensiveSearchTimer  = 0;
  private intensiveSearchTimeout = 5000; // ms — luego vendrá de gameConfig

  constructor() {
    super();
    this.state = "patrolling";
  }

  // ─────────────────────────────────────────────
  //  TICK — llamado por SentinelController en cada frame
  // ─────────────────────────────────────────────
  tick(dt: number): void {
    if (this.state !== "intensiveSearch") return;
    this.intensiveSearchTimer += dt;
    if (this.intensiveSearchTimer >= this.intensiveSearchTimeout) {
      this.setState("patrolling");
    }
  }

  // ─────────────────────────────────────────────
  //  HOOKS
  // ─────────────────────────────────────────────
  protected onEnter(state: SentinelState): void {
    switch (state) {
      case "intensiveSearch":
        this.intensiveSearchTimer = 0;
        break;
    }
  }

  protected onExit(state: SentinelState): void {
    switch (state) {
      case "intensiveSearch":
        this.intensiveSearchTimer = 0;
        break;
    }
  }

  // ─────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────
  isPatrolling():       boolean { return this.state === "patrolling"; }
  isShooting():         boolean { return this.state === "shooting"; }
  isSearching():        boolean { return this.state === "searching"; }
  isIntensiveSearch():  boolean { return this.state === "intensiveSearch"; }

  dispose(): void {}
}