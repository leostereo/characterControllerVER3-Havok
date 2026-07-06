// src/enemies/sentinelV1/SentinelController.ts

import {
    type Scene,
    type Mesh,
    type AbstractMesh,
    type TransformNode,
    type Observer,
    Vector3,
    Ray,
} from "@babylonjs/core";
import type { IBaseController } from "../interfaces";
import { NavMeshService } from "@/playground/NavMeshService";
import { meshNames, sentinelConfig } from "@/config/GameConfig";
import type { SentinelFSM } from "./SentinelFSM";
import { VisionCone } from "./VisionCone";

// ─────────────────────────────────────────────
//  CONFIG — vendrá de gameConfig.sentinel
// ─────────────────────────────────────────────
const TRACKING_RATE = 100;       // ms

export class SentinelController implements IBaseController {

    private renderObserver: Observer<Scene> | null = null;
    private trackingElapsed = 0;
    private lastKnownPosition: Vector3 | null = null;
    private agentId!: number;
    private visionCone: VisionCone;
    private navMesh: NavMeshService;
    private sweepAngle = 0;
    private sweepDirection = 1;
    private trackedMesh: AbstractMesh | null = null;
    private readonly RAYCAST_ENDING_YOFFSET_MULTIPLIER = sentinelConfig.detection.raycastEndingYOffsetMultiplier


    constructor(
        private scene: Scene,
        private fsm: SentinelFSM,        // ← concreto
        private rootNode: TransformNode,
        private rotationPivot: TransformNode,
        private barrel: Mesh,
        private meshForPositionTrackName: string,
        private meshForRayCastDetectionName: string,
        private barrelHeight: number = 3,
    ) {
        this.navMesh = NavMeshService.getInstance(scene);
        this.visionCone = new VisionCone(scene, rotationPivot, barrel, barrelHeight);
        this.visionCone.buildVisuals();

        this.agentId = this.navMesh.addAgent(
            rootNode.position,
            {
                radius: sentinelConfig.agent.radius,
                height: sentinelConfig.agent.height,
                maxAcceleration: sentinelConfig.agent.maxAcceleration,
                maxSpeed: sentinelConfig.agent.speedPatrol,
                collisionQueryRange: sentinelConfig.agent.collisionQueryRange,
                separationWeight: sentinelConfig.agent.separationWeight,
            }
        ); this.trackedMesh = this.resolveTrackedMesh();

    }

    // ─────────────────────────────────────────────
    //  CICLO DE VIDA
    // ─────────────────────────────────────────────
    start(): void {
        this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
            const dt = this.scene.getEngine().getDeltaTime();
            const playerInSight = this.hasLineOfSight();
            const currentState = this.fsm.getState();

            // ── Sincronizar posición del rootNode con el agente ──
            this.syncPosition();

            // ── Actualizar color del cono ──
            this.visionCone.update(currentState);

            // ── Lógica por estado ──

            switch (currentState) {

                case "patrolling":
                    if (playerInSight) {
                        this.fsm.setState("shooting");
                    } else {
                        this.sweep(dt);
                        this.updatePatrolDestination();
                    }
                    break;

                case "shooting":
                    if (playerInSight) {
                        this.trackingElapsed += dt;
                        if (this.trackingElapsed >= TRACKING_RATE) {
                            this.trackingElapsed = 0;
                            this.trackTarget();
                        }
                    } else {
                        this.trackingElapsed = 0;
                        this.fsm.setState("searching");
                    }
                    break;

                case "searching":
                    if (playerInSight) {
                        this.fsm.setState("shooting");
                    } else {
                        this.moveToLastKnownPosition();
                        this.sweep(dt);
                        if (this.hasReachedLastKnownPosition()) {
                            this.fsm.setState("intensiveSearch");
                        }
                    }
                    break;

                case "intensiveSearch":
                    if (playerInSight) {
                        this.fsm.setState("shooting");
                    } else {
                        this.sweep(dt);
                        this.fsm.tick(dt);   // ← sin error
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
        this.visionCone.dispose();
    }

    dispose(): void {
        this.stop();
        this.navMesh.removeAgent(this.agentId);
    }

    // ─────────────────────────────────────────────
    //  API PÚBLICA
    // ─────────────────────────────────────────────
    getMuzzlePositionAndDirection(): { origin: Vector3; direction: Vector3 } | null {
        return {
            origin: this.barrel.getAbsolutePosition(),
            direction: this.rotationPivot.forward.normalize(),
        };
    }

    removeAgent(): void {
        this.navMesh.removeAgent(this.agentId);
    }

    disposeVisionCone(): void {
        this.visionCone.dispose();
    }

    // ─────────────────────────────────────────────
    //  DETECCIÓN
    // ─────────────────────────────────────────────
    private hasLineOfSight(): boolean {
        // chequeo del cono — delegado a VisionCone
        if (!this.visionCone.isPlayerInCone(this.meshForPositionTrackName)) return false;

        // raycast — confirma línea de vista sin obstáculos
        const target = this.scene.getMeshByName(this.meshForPositionTrackName);
        if (!target) return false;

        const origin = this.barrel.getAbsolutePosition().clone();
        origin.y += sentinelConfig.detection.raycastYOffset;

        // raycast to %of iths heigh -> charcater can hide behind walls.
        const targetPos = target.position.clone();
        const raycastMesh = this.scene.getMeshByName(this.meshForRayCastDetectionName);
        if (raycastMesh) {
            const boundingBox = raycastMesh.getBoundingInfo().boundingBox;
            const characterBaseY = boundingBox.minimumWorld.y;
            const characterHeight = boundingBox.maximumWorld.y - characterBaseY;
            targetPos.y = characterBaseY + characterHeight * this.RAYCAST_ENDING_YOFFSET_MULTIPLIER;
        }

        const dirToTarget = targetPos.subtract(origin).normalize();
        const distance = Vector3.Distance(origin, targetPos);

        const ray = new Ray(origin, dirToTarget, distance);

        const hit = this.scene.pickWithRay(ray, (mesh) =>
            !mesh.name.startsWith("sentinel_") &&
            !mesh.name.startsWith(meshNames.projectile)
        );

        const detected = hit?.pickedMesh?.name === this.meshForRayCastDetectionName;
        if (detected) this.lastKnownPosition = target.position.clone();
        return detected;
    }

    // ─────────────────────────────────────────────
    //  TRACKING
    // ─────────────────────────────────────────────
    private trackTarget(): void {
        const target = this.scene.getMeshByName(this.meshForPositionTrackName);
        if (!target) return;

        const origin = this.barrel.getAbsolutePosition();
        const aimTarget = target.position.add(
            new Vector3(0, sentinelConfig.detection.aimHeightMult, 0)
        );
        const direction = aimTarget.subtract(origin).normalize();

        // ángulo world del target
        const worldAngleY = Math.atan2(direction.x, direction.z);

        // convertir a local restando la rotación del rootNode
        const localAngleY = worldAngleY - this.rootNode.rotation.y;

        this.rotationPivot.rotation.y = localAngleY;
        this.rotationPivot.rotation.x = -Math.asin(
            Math.min(1, Math.max(-1, direction.y))
        );
    }

    // ─────────────────────────────────────────────
    //  SWEEP
    // ─────────────────────────────────────────────
    private sweep(dt: number): void {
        this.sweepAngle += sentinelConfig.sweep.speed * this.sweepDirection * (dt / 1000);

        if (this.sweepAngle >= sentinelConfig.sweep.angle) {
            this.sweepAngle = sentinelConfig.sweep.angle;
            this.sweepDirection = -1;
        } else if (this.sweepAngle <= -sentinelConfig.sweep.angle) {
            this.sweepAngle = -sentinelConfig.sweep.angle;
            this.sweepDirection = 1;
        }

        // solo el sweep, sin sumar la rotación del rootNode
        this.rotationPivot.rotation.y = this.sweepAngle;
    }

    // ─────────────────────────────────────────────
    //  NAVMESH — movimiento
    // ─────────────────────────────────────────────
    private syncPosition(): void {
        const pos = this.navMesh.getAgentPosition(this.agentId);
        if (!pos) return;

        this.rootNode.position.x = pos.x;
        this.rootNode.position.z = pos.z;

        // Orientar el cuerpo hacia la dirección de movimiento
        const vel = this.navMesh.getAgentVelocity(this.agentId);
        if (vel && (vel.x !== 0 || vel.z !== 0)) {
            this.rootNode.rotation.y = Math.atan2(vel.x, vel.z);
        }
    }

    private updatePatrolDestination(): void {
        const pos = this.navMesh.getAgentPosition(this.agentId);
        if (!pos) return;

        const vel = this.navMesh.getAgentVelocity(this.agentId);
        const isIdle = vel && vel.length() < 0.1;

        if (isIdle) {
            const target = this.getRandomNavMeshPoint();
            if (target) {
                this.navMesh.setAgentTarget(this.agentId, target);
            }
        }
    }

    private resolveTrackedMesh(): AbstractMesh | null {
        if (this.trackedMesh && !this.trackedMesh.isDisposed()) {
            return this.trackedMesh;
        }

        const mesh = this.scene.getMeshByName(this.meshForPositionTrackName);
        this.trackedMesh = mesh ?? null;
        return this.trackedMesh;
    }

    private moveToLastKnownPosition(): void {
        if (!this.lastKnownPosition) return;
        this.navMesh.setAgentTarget(this.agentId, this.lastKnownPosition);
    }

    private hasReachedLastKnownPosition(): boolean {
        if (!this.lastKnownPosition) return false;

        const pos = this.navMesh.getAgentPosition(this.agentId);
        if (!pos) return false;

        return Vector3.Distance(pos, this.lastKnownPosition) < 0.5;
    }

    private getRandomNavMeshPoint(): Vector3 | null {
        const result = this.navMesh.getRandomPoint();
        return result.success ? result.randomPoint : null;
    }
}