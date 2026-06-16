import type {
    Scene,
    AbstractMesh,
    AnimationGroup,
    Vector3,
    Observer,
} from "@babylonjs/core";
import type { IBaseEnemy } from "../interfaces";
import { CyborgFSM } from "./CyborgFSM";
import { CyborgBody } from "./CyborgBody";
import { EventManager } from "@/game/eventManager/eventManager";
import { cyborgConfig, meshMetadata } from "@/config/GameConfig";
import { CyborgController } from "./CyborgController";
import { ProjectileManager } from "../ProjectileManager";

export class CyborgMain implements IBaseEnemy {

    private fsm: CyborgFSM;
    private body: CyborgBody;
    private controller: CyborgController;
    private eventManager = EventManager.getInstance();
    private hitObserver: ReturnType<typeof EventManager.prototype.subscribe> | null = null;
    private shootingObserver: Observer<Scene> | null = null;
    private elapsed = 0;
    private projectileManager: ProjectileManager;
    
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
        this.projectileManager = new ProjectileManager(scene,'laser');
        this.setupShootingLoop();

    }

    stop(): void {
        throw new Error("Method not implemented.");
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
            this.hitObserver = null;
        }
        this.controller.dispose();
        this.body.dispose();
        this.fsm.dispose();
    }

    // ─────────────────────────────────────────────
    //  HIT
    // ─────────────────────────────────────────────
    private subscribeToHit(): void {
        this.hitObserver = this.eventManager.subscribe((event) => {
            if (event.type !== "enemy_damaged") return;

            const data = event.data as { enemyClass: string; stationId: string };
            if (data.enemyClass !== meshMetadata.enemyClasses.cyborg) return;
            if (data.stationId !== this.uniqueId) return;
    
            this.controller.stopAgent();   
            this.fsm.savePreviousState();
            this.fsm.setState("hit_reaction");
            //getForwardFromController()
            //calculate angle difference.
            //todo:setState(hit_fromXXX)
        });
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