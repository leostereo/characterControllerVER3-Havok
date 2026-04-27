import {
    type Scene,
    type Mesh,
    type TransformNode,
    type PointLight,
    type PhysicsAggregate,
    StandardMaterial,
    Color3,
} from "@babylonjs/core";
import { type CanionController } from "../controllers/CanionController";
import { EventManager } from "@/game/eventManager/eventManager";
import { ParticlesManager } from "@/game/effects/ParticlesManager";
import { ProjectileManager } from "./projectileManager";
import { enemiesConfig, meshMetadata, meshNames } from "@/config/GameConfig";
import { type CanionStateMachine } from "../stateMachines/CanionStateMachine";

export class CanionManager {

    private readonly SHOOTING_RATE = enemiesConfig.canion.shootingRate;

    private elapsed = 0;
    private eventManager = EventManager.getInstance();
    private particlesManager = ParticlesManager.getInstance();
    private projectileManager: ProjectileManager;

    constructor(
        private scene: Scene,
        private bodyMesh: Mesh,
        private barrelPivot: TransformNode,
        private searchLight: PointLight,
        private bodyAggregate: PhysicsAggregate,
        private stateMachine: CanionStateMachine,
        private controller: CanionController,
        private id: string,  
    ) {
        this.projectileManager = new ProjectileManager(scene);
    }

    // ─────────────────────────────────────────────
    //  CICLO DE VIDA
    // ─────────────────────────────────────────────
    initialize(): void {
        this.subscribeToStateChange();
        this.subscribeToHit();
        this.setupShootingLoop();
    }

    // ─────────────────────────────────────────────
    //  LOOP DE DISPARO
    // ─────────────────────────────────────────────
    private setupShootingLoop(): void {
        this.scene.onBeforeRenderObservable.add(() => {
            if (this.stateMachine.getState() !== "alert") return;

            this.elapsed += this.scene.getEngine().getDeltaTime();
            if (this.elapsed >= this.SHOOTING_RATE) {
                this.elapsed = 0;
                this.shoot();
            }
        });
    }

    private shoot(): void {
        const shot = this.controller.getMuzzlePositionAndDirection();
        if (!shot) return;
        this.projectileManager.throwProjectile(shot.origin, shot.direction);
    }

    // ─────────────────────────────────────────────
    //  CAMBIOS DE ESTADO — efectos visuales
    // ─────────────────────────────────────────────
    private subscribeToStateChange(): void {
        this.stateMachine.onStateChange((state) => {
            switch (state) {
                case "alert":
                    this.applyStateColor(new Color3(0.8, 0.1, 0.0), new Color3(1.0, 0.2, 0.0));
                    this.searchLight.diffuse = new Color3(1.0, 0.2, 0.0);
                    this.searchLight.intensity = 1.2;
                    break;

                case "searching":
                    this.applyStateColor(new Color3(0.4, 0.35, 0.0), new Color3(0.8, 0.7, 0.0));
                    this.searchLight.diffuse = new Color3(1.0, 0.9, 0.0);
                    this.searchLight.intensity = 0.8;
                    break;

                case "destroyed":
                    this.destroy();
                    break;
            }
        });
    }

    // ─────────────────────────────────────────────
    //  DESTRUCCIÓN
    // ─────────────────────────────────────────────
    private subscribeToHit(): void {
        const observer = this.eventManager.subscribe((event) => {
            if (this.stateMachine.isDestroyed()) return;
            if (event.type !== "enemy_damaged") return;

            const data = event.data as { enemyClass: string; canionId: string };
            if (data.enemyClass !== meshMetadata.enemyClasses.canion) return;
            if (data.canionId !== this.id) return;   // ← solo el cañón correcto reacciona

            this.eventManager.unsubscribe(observer);
            this.stateMachine.setState("destroyed");
        });
    }
    private destroy(): void {
        this.controller.stop();

        this.particlesManager.generateCanionDestruction(
            this.bodyMesh.getAbsolutePosition()
        );

        this.bodyMesh.setEnabled(false);
        this.barrelPivot.setEnabled(false);
        this.searchLight.setEnabled(false);
        this.bodyAggregate.dispose();

        this.applyDestroyedMaterial();
    }

    private applyDestroyedMaterial(): void {
        const base = this.scene.getMeshByName(meshNames.canionBase);
        if (!base) return;

        const mat = new StandardMaterial("canio_destroyed_mat", this.scene);
        mat.diffuseColor = new Color3(0.15, 0.10, 0.08);
        mat.emissiveColor = new Color3(0.05, 0.02, 0.0);
        mat.specularColor = new Color3(0.1, 0.1, 0.1);
        base.material = mat;
    }

    private applyStateColor(diffuse: Color3, emissive: Color3): void {
        const mat = this.bodyMesh.material as StandardMaterial;
        if (!mat) return;
        mat.diffuseColor = diffuse;
        mat.emissiveColor = emissive;
    }
}