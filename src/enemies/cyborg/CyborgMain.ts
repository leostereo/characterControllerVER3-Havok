import {
    type Scene,
    type AbstractMesh,
    type AnimationGroup,
    Vector3,
    type Observer,
} from "@babylonjs/core";
import type { IBaseEnemy } from "../interfaces";
import { CyborgFSM, type CyborgState } from "./CyborgFSM";
import { CyborgBody } from "./CyborgBody";
import { EventManager } from "@/game/eventManager/eventManager";
import { cyborgConfig, meshMetadata } from "@/config/GameConfig";
import { CyborgController } from "./CyborgController";
import { ProjectileManager } from "../ProjectileManager";
import { CyborgDebugger } from "@/debub/CyborgDebugger";

export class CyborgMain implements IBaseEnemy {

    private fsm: CyborgFSM;
    private body: CyborgBody;
    private controller: CyborgController;
    private eventManager = EventManager.getInstance();
    private hitObserver: ReturnType<typeof EventManager.prototype.subscribe> | null = null;
    private shootingObserver: Observer<Scene> | null = null;
    private elapsed = 0;
    private projectileManager: ProjectileManager;
    private debugger: CyborgDebugger | null = null;
    private readonly DEBUG = false;   // ← cambiar a false en producción


    constructor(
        private scene: Scene,
        private uniqueId: string,
        rootMesh: AbstractMesh,
        animations: AnimationGroup[],
        position: Vector3,
        private meshForPositionTrackName: string,
        private meshForRayCastDetectionName: string,

    ) {
        this.fsm = new CyborgFSM();
        this.body = new CyborgBody(scene, this.fsm, rootMesh, animations, uniqueId);
        this.body.setPosition(position);

        this.controller = new CyborgController(
            scene,
            this.fsm,
            rootMesh,
            meshForPositionTrackName,
            meshForRayCastDetectionName,
            this.body.getColliderMesh(),   // ← nuevo
        );

        this.subscribeToHit();
        this.projectileManager = new ProjectileManager(scene, 'laser');
        this.setupShootingLoop();


        // al final del constructor:
        if (this.DEBUG) {
            this.debugger = new CyborgDebugger(scene, this.fsm, this.controller);
        }
    }

    stop(): void {
        this.controller.stop()
    }

    // ─────────────────────────────────────────────
    //  CICLO DE VIDA
    // ─────────────────────────────────────────────
    start(): void {
        this.controller.start();
        this.fsm.setState("patrolling");
    }

    dispose(): void {
        if (this.hitObserver) {
            this.eventManager.unsubscribe(this.hitObserver);
            this.scene.onBeforeRenderObservable.remove(this.shootingObserver);
            this.hitObserver = null;
        }
        this.controller.dispose();
        this.body.dispose();
        this.fsm.dispose();
        this.debugger?.dispose();
    }

    // ─────────────────────────────────────────────
    //  HIT
    // ─────────────────────────────────────────────
    private subscribeToHit(): void {
        this.hitObserver = this.eventManager.subscribe((event) => {
            if (event.type !== "enemy_damaged") return;

            if (!this.isPossibleToHit()) return;

            const data = event.data as { enemyClass: string; stationId: string, direction: Vector3 };
            if (data.enemyClass !== meshMetadata.enemyClasses.cyborg) return;
            if (data.stationId !== this.uniqueId) return;
            this.controller.stopAgent();
            this.fsm.savePreviousState();
            const currentHealth = this.fsm.getHealth();
            if (currentHealth === 1) {
                this.fsm.setState('defeated');
                this.emitCollapsedEvent();
            }
            if (currentHealth > 1) {

                const cyborgForward = this.controller.getForward();
                const hitState = this.getNextHitReactionFromAngle(
                    cyborgForward,
                    data.direction
                );

                this.fsm.setState(hitState);
            }
        });
    }

    private isPossibleToHit(): boolean {
        const currentState = this.fsm.getState();
        let canBeHited = true;
        switch (currentState) {
            case 'defeated':
            case 'hit_reaction_back':
            case 'hit_reaction_forward':
            case 'hit_reaction_left':
            case 'hit_reaction_right':
                canBeHited = false;
                break;

            default:
                break;
        }

        return canBeHited;

    }

    private emitCollapsedEvent(): void {
        this.eventManager.emit({
            type: "enemy_destroyed",
            source: "player1",
            sourceType: "player",
            data: { id: this.uniqueId },
        });
    }

    private getNextHitReactionFromAngle(
        cyborgForward: Vector3,
        projectileForward: Vector3
    ): CyborgState {
        // normalizar ambos vectores en XZ
        const cf = new Vector3(cyborgForward.x, 0, cyborgForward.z).normalize();
        const pf = new Vector3(projectileForward.x, 0, projectileForward.z).normalize();

        // producto punto — qué tan alineados están
        const dot = Vector3.Dot(cf, pf);

        // producto cruzado Y — izquierda o derecha
        const cross = cf.x * pf.z - cf.z * pf.x;

        if (Math.abs(dot) >= Math.abs(cross)) {
            // impacto frontal o trasero
            return dot > 0
                ? "hit_reaction_forward"   // frisbee viene desde atrás
                : "hit_reaction_back";     // frisbee viene desde adelante
        } else {
            // impacto lateral
            return cross > 0
                ? "hit_reaction_right"     // frisbee viene desde la izquierda
                : "hit_reaction_left";     // frisbee viene desde la derecha
        }
    }

    private setupShootingLoop(): void {
        this.shootingObserver = this.scene.onBeforeRenderObservable.add(() => {
            if (this.fsm.getState() !== "shooting") return;
            if (this.fsm.isBlocking()) return;

            this.elapsed += this.scene.getEngine().getDeltaTime();
            if (this.elapsed < cyborgConfig.projectile.shootingRate) return;

            this.elapsed = 0;
            const shot = this.controller.getMuzzlePositionAndDirection();
            if (shot) this.projectileManager.throwProjectile(shot.origin, shot.direction);
        });
    }

}