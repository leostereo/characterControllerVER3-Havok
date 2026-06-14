// src/enemies/cyborgV1/CyborgController.ts

import {
    type Scene,
    type AbstractMesh,
    type Observer,
    Vector3,
    type Mesh,
    Quaternion,
    Ray,        // ← nuevo
} from "@babylonjs/core";
import type { ICyborgStateMachine } from "../interfaces/ICyborgStateMachine";
import { NavMeshService } from "@/playground/NavMeshService";
import { meshNames, cyborgConfig } from "@/config/GameConfig";  // ← agregar meshNames
import { CyborgVisionCone } from "./CyborgVisionCone";

export class CyborgController {



    private renderObserver: Observer<Scene> | null = null;
    private agentId!: number;
    private navMesh: NavMeshService;
    private readonly ROTATION_SPEED = 5.0;
    private lastKnownPosition: Vector3 | null = null;
    private visionCone: CyborgVisionCone;
    constructor(
        private scene: Scene,
        private fsm: ICyborgStateMachine,
        private rootMesh: AbstractMesh,
        private meshForPositionTrackName: string,
        private meshForRayCastDetectionName: string,
        private colliderMesh: Mesh | null,

    ) {
        this.visionCone = new CyborgVisionCone(scene, rootMesh);
        this.visionCone.buildVisuals();

        this.navMesh = NavMeshService.getInstance(scene);
        this.agentId = this.navMesh.addAgent(
            rootMesh.getAbsolutePosition(),
            {
                radius: 0.3,
                height: 1.8,
                maxAcceleration: 4.0,
                maxSpeed: cyborgConfig.agent.speedPatrol,
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
            if (this.fsm.isBlocking()) return;   // ← no procesar si está bloqueado

            
            // const dt = this.scene.getEngine().getDeltaTime();
            const playerInSight = this.hasLineOfSight();
            const currentState = this.fsm.getState();
            // this.visionCone.update(currentState);
            this.visionCone.update();

            switch (currentState) {
                case "patrolling":
                    if (playerInSight) {
                        this.stopAgent();
                        this.fsm.setState("shooting");
                    } else {
                        this.syncPosition();
                        this.updatePatrolDestination();
                    }
                    break;

                case "shooting":
                    if (playerInSight) {
                        this.trackTarget();
                    } else {
                        //this.fsm.setState("searching");
                    }
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
        this.visionCone.dispose();
    }

    // ─────────────────────────────────────────────
    //  NAVMESH
    // ─────────────────────────────────────────────
    private hasLineOfSight(): boolean {
        const target = this.scene.getMeshByName(this.meshForPositionTrackName);
        if (!target) return false;

        if (!this.visionCone.isPlayerInCone(this.meshForPositionTrackName)) return false;

        const origin = this.rootMesh.getAbsolutePosition().clone();
        origin.y += cyborgConfig.detection.raycastYOffset;

        const dirToTarget = target.position.subtract(origin).normalize();
        const distance = Vector3.Distance(origin, target.position);
        const ray = new Ray(origin, dirToTarget, distance);

        const hit = this.scene.pickWithRay(ray, (mesh) =>
            !mesh.name.startsWith("cyborg_") &&
            !mesh.name.startsWith("Ch45_") &&
            !mesh.name.startsWith(meshNames.projectile)
        );

        const detected = hit?.pickedMesh?.name === this.meshForRayCastDetectionName;
        if (detected) this.lastKnownPosition = target.position.clone();
        return detected;
    }

    private trackTarget(): void {
        const target = this.scene.getMeshByName(this.meshForPositionTrackName);
        if (!target) return;

        const origin = this.rootMesh.getAbsolutePosition();
        const direction = target.position.subtract(origin).normalize();
        const angle = Math.atan2(direction.x, direction.z) + Math.PI;

        this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, angle, 0);
    }

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