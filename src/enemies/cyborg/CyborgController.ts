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
import { type CyborgState } from "./CyborgFSM";

export class CyborgController {

    private renderObserver: Observer<Scene> | null = null;
    private agentId!: number;
    private navMesh: NavMeshService;
    private readonly ROTATION_SPEED = 5.0;
    private lastKnownPosition: Vector3 | null = null;
    private visionCone: CyborgVisionCone;
    private searchDestination: Vector3 | null = null;
    private lastState: CyborgState | null = null;
    private trackingElapsed = 0;
    private sweepAngle = 0;
    private sweepDirection = 1;
    private baseAngle = 0;   // ← ángulo base para intensiveSearch

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
            if (this.fsm.isBlocking()) return;

            const dt = this.scene.getEngine().getDeltaTime();
            const playerInSight = this.hasLineOfSight();
            const currentState = this.fsm.getState();

            // cambiar velocidad al cambiar estado
            if (currentState !== this.lastState) {
                this.lastState = currentState;
                switch (currentState) {
                    case "patrolling":
                        this.navMesh.setAgentMaxSpeed(this.agentId, cyborgConfig.agent.speedPatrol);
                        this.searchDestination = null;
                        break;
                    case "searching":
                        this.navMesh.setAgentMaxSpeed(this.agentId, cyborgConfig.agent.speedSearch);
                        this.searchDestination = null;   // ← resetear para calcular nuevo destino
                        break;
                    case "intensiveSearch":
                        this.stopAgent();
                        const forward = this.rootMesh.forward.normalize();
                        this.baseAngle = Math.atan2(forward.x, forward.z) + Math.PI;
                        this.sweepAngle = 0;   // ← resetear sweep al entrar
                        break;
                    case "shooting":
                        this.navMesh.stopAgentImmediate(this.agentId);
                        break;
                }
            }

            // ── siempre sincronizar ──
            this.syncPosition();

            // ── actualizar cono ──
            this.visionCone.update();

            switch (currentState) {
                case "patrolling":
                    if (playerInSight) {
                        this.fsm.setState("shooting");
                    } else {
                        this.updatePatrolDestination();
                    }
                    break;

                case "shooting":
                    if (playerInSight) {
                        this.trackingElapsed += dt;
                        if (this.trackingElapsed >= cyborgConfig.tracking.rate) {
                            this.trackingElapsed = 0;
                            this.trackTarget();
                        }
                    } else {
                        this.trackingElapsed = 0;
                        this.searchDestination = null;
                        this.fsm.setState("searching");
                    }
                    break;

                case "searching":
                    if (playerInSight) {
                        this.fsm.setState("shooting");
                    } else {
                        this.moveToLastKnownPosition();
                        if (this.hasReachedLastKnownPosition()) {
                            this.searchDestination = null;
                            this.fsm.setState("intensiveSearch");
                        }
                    }
                    break;

                case "intensiveSearch":
                    if (playerInSight) {
                        this.fsm.setState("shooting");
                    } else {
                        this.sweepIntensive(dt);   // ← nuevo método
                        this.fsm.tick(dt);
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
        this.navMesh.stopAgentImmediate(this.agentId);
    }

    getMuzzlePositionAndDirection(): { origin: Vector3; direction: Vector3 } | null {
        const target = this.scene.getMeshByName(this.meshForPositionTrackName);
        if (!target) return null;

        // origen — posición del rootMesh + offset altura
        const origin = this.rootMesh.getAbsolutePosition().clone();
        origin.y += cyborgConfig.projectile.muzzleHeight;  // ← agregar a config

        const direction = target.position.subtract(origin).normalize();
        return { origin, direction };
    }

    getLastKnownPosition(): Vector3 | null { return this.lastKnownPosition; }
    getSearchDestination(): Vector3 | null { return this.searchDestination; }

    getForward(): Vector3 {
        return this.rootMesh.forward.normalize();
    }

    dispose(): void {
        this.stop();
        this.navMesh.removeAgent(this.agentId);
        this.visionCone.dispose();
    }

    private sweepIntensive(dt: number): void {
        this.sweepAngle += cyborgConfig.sweep.intensiveSpeed * this.sweepDirection * (dt / 1000);

        if (this.sweepAngle >= cyborgConfig.sweep.intensiveAngle) {
            this.sweepAngle = cyborgConfig.sweep.intensiveAngle;
            this.sweepDirection = -1;
        } else if (this.sweepAngle <= -cyborgConfig.sweep.intensiveAngle) {
            this.sweepAngle = -cyborgConfig.sweep.intensiveAngle;
            this.sweepDirection = 1;
        }

        this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(
            0,
            this.baseAngle + this.sweepAngle,
            0
        );
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

        const detected = hit?.pickedMesh?.name.startsWith(this.meshForRayCastDetectionName);
        if (detected) {
            this.lastKnownPosition = target.position.clone();
            return true;
        }
        return false;
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

    private moveToLastKnownPosition(): void {
        if (!this.lastKnownPosition) return;
        if (this.searchDestination) return;

        const agentPos = this.navMesh.getAgentPosition(this.agentId);
        if (!agentPos) return;

        // dirección desde el agente hacia la última posición conocida
        const dir = this.lastKnownPosition.subtract(agentPos).normalize();

        // ir un poco más allá del último punto visto
        const overshoot = cyborgConfig.agent.searchOvershoot ?? 2.0;  // ← nuevo param
        const candidatePos = this.lastKnownPosition.add(dir.scale(overshoot));

        // validar que el punto está en el NavMesh
        const validPos = this.navMesh.findClosestNavMeshPoint(candidatePos);
        this.searchDestination = validPos ?? this.lastKnownPosition;

        this.navMesh.setAgentTarget(this.agentId, this.searchDestination);
    }
    private hasReachedLastKnownPosition(): boolean {
        if (!this.searchDestination) return false;
        const pos = this.navMesh.getAgentPosition(this.agentId);
        if (!pos) return false;
        return Vector3.Distance(pos, this.searchDestination) < 2.5;  // ← era 0.5
    }

}