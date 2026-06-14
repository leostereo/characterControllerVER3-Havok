// src/enemies/cyborgV1/CyborgController.ts

import {
    type Scene,
    type AbstractMesh,
    type Observer,
    type Vector3,
    type Mesh,
    Quaternion,
} from "@babylonjs/core";
import type { ICyborgStateMachine } from "../interfaces/ICyborgStateMachine";
import { NavMeshService } from "@/playground/NavMeshService";
import { sentinelConfig } from "@/config/GameConfig";  // ← reutilizamos por ahora

export class CyborgController {

    private renderObserver: Observer<Scene> | null = null;
    private agentId!: number;
    private navMesh: NavMeshService;
    private readonly ROTATION_SPEED = 5.0;

    constructor(
        private scene: Scene,
        private fsm: ICyborgStateMachine,
        private rootMesh: AbstractMesh,
        private meshForPositionTrackName: string,
        private meshForRayCastDetectionName: string,
        private colliderMesh: Mesh | null,

    ) {
        this.navMesh = NavMeshService.getInstance(scene);
        this.agentId = this.navMesh.addAgent(
            rootMesh.getAbsolutePosition(),
            {
                radius: 0.3,
                height: 1.8,
                maxAcceleration: 4.0,
                maxSpeed: sentinelConfig.agent.speedPatrol,
                collisionQueryRange: 0.5,
                separationWeight: 1.0,
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

    stopAgent(): void {
        const pos = this.navMesh.getAgentPosition(this.agentId);
        if (!pos) return;
        this.navMesh.setAgentTarget(this.agentId, pos);
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

        // sincronizar cápsula
        if (this.colliderMesh) {
            this.colliderMesh.position.x = pos.x;
            this.colliderMesh.position.z = pos.z;
        }

        const vel = this.navMesh.getAgentVelocity(this.agentId);
        if (vel && vel.length() > 0.1) {
            const angle = Math.atan2(vel.x, vel.z) + Math.PI;
            this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, angle, 0);
        }
    }

    private updatePatrolDestination(): void {
        const pos = this.navMesh.getAgentPosition(this.agentId);
        if (!pos) return;

        const vel = this.navMesh.getAgentVelocity(this.agentId);

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