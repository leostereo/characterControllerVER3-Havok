// src/enemies/cyborgV1/CyborgController.ts

import type {
  Scene,
  AbstractMesh,
  Observer,
  Vector3,
} from "@babylonjs/core";
import type { ICyborgStateMachine } from "../interfaces/ICyborgStateMachine";
import { NavMeshService }           from "@/playground/NavMeshService";
import { sentinelConfig }           from "@/config/GameConfig";  // ← reutilizamos por ahora

export class CyborgController {

  private renderObserver: Observer<Scene> | null = null;
  private agentId!: number;
  private navMesh: NavMeshService;

  constructor(
    private scene:                       Scene,
    private fsm:                         ICyborgStateMachine,
    private rootMesh:                    AbstractMesh,
    private meshForPositionTrackName:    string,
    private meshForRayCastDetectionName: string,
  ) {
    this.navMesh = NavMeshService.getInstance(scene);
    this.agentId = this.navMesh.addAgent(
      rootMesh.getAbsolutePosition(),
      {
        radius:               0.3,
        height:               1.8,
        maxAcceleration:      4.0,
        maxSpeed:             sentinelConfig.agent.speedPatrol,
        collisionQueryRange:  0.5,
        separationWeight:     1.0,
      }
    );
  }

  // ─────────────────────────────────────────────
  //  CICLO DE VIDA
  // ─────────────────────────────────────────────
  start(): void {
    this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
      const currentState = this.fsm.getState();

      switch (currentState) {
        case "patrolling":
          this.syncPosition();
          this.updatePatrolDestination();
          break;
      }
    });
  }

  stop(): void {
    if (this.renderObserver) {
      this.scene.onBeforeRenderObservable.remove(this.renderObserver);
      this.renderObserver = null;
    }
  }

  dispose(): void {
    this.stop();
    this.navMesh.removeAgent(this.agentId);
  }

  // ─────────────────────────────────────────────
  //  NAVMESH
  // ─────────────────────────────────────────────
  private syncPosition(): void {
    const pos = this.navMesh.getAgentPosition(this.agentId);
    if (!pos) return;

    this.rootMesh.position.x = pos.x;
    this.rootMesh.position.z = pos.z;
  }

  private updatePatrolDestination(): void {
    const pos = this.navMesh.getAgentPosition(this.agentId);
    if (!pos) return;

    const vel    = this.navMesh.getAgentVelocity(this.agentId);
    const isIdle = vel && vel.length() < 0.1;

    if (isIdle) {
      const target = this.getRandomNavMeshPoint();
      if (target) this.navMesh.setAgentTarget(this.agentId, target);
    }
  }

  private getRandomNavMeshPoint(): Vector3 | null {
    const result = this.navMesh.getRandomPoint();
    return result.success ? result.randomPoint : null;
  }
}