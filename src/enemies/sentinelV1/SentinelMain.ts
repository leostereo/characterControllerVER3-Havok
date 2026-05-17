// src/enemies/sentinelV1/SentinelClass.ts

import {
    type Scene,
    type Mesh,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Vector3,
    TransformNode,
    PhysicsAggregate,
    PhysicsShapeType,
    PhysicsMotionType,
} from "@babylonjs/core";
import type { IBaseEnemy, IBaseController } from "../interfaces";
import { SentinelFSM } from "./SentinelFSM";
import { SentinelController } from "./SentinelController";
import { ProjectileManager } from "./ProjectileManager";
import { EventManager } from "@/game/eventManager/eventManager";
import { meshMetadata, type MeshMetadata } from "@/config/GameConfig";

export class SentinelMain implements IBaseEnemy {

    private fsm: SentinelFSM;
    private controller: IBaseController;
    private sentinelController: SentinelController;
    private projectileManager: ProjectileManager;
    private rootNode: TransformNode;
    private rotationPivot: TransformNode;
    private barrel: Mesh;
    private elapsed = 0;
    // ── nuevas propiedades privadas ──
    private baseGroup: TransformNode;
    private towerGroup: TransformNode;
    private headGroup: TransformNode;
    private collapsed = false;
    private eventManager = EventManager.getInstance();
    private baseAggregate: PhysicsAggregate;
    private towerAggregate: PhysicsAggregate;
    private headAggregate: PhysicsAggregate;
    private bodyAggregate: PhysicsAggregate;
    private bodyMesh: Mesh;
    private upperTowerMesh: Mesh;
    private headMesh: Mesh;

    private readonly uniqueId = `sentinel_${Math.random().toString(36).slice(2, 7)}`;
    private readonly SHOOTING_RATE = 800; // ms — vendrá de gameConfig.sentinel

    constructor(
        private scene: Scene,
        private position: Vector3,
        private meshForPositionTrackName: string,
        private meshForRayCastDetectionName: string,
    ) {
        this.rootNode = new TransformNode(`sentinel_root_${this.uniqueId}`, scene);
        this.rootNode.position = position.clone();

        const { rotationPivot, barrel } = this.buildGeometry();
        this.rotationPivot = rotationPivot;
        this.barrel = barrel;

        this.subscribeToHit();

        this.fsm = new SentinelFSM();

        this.sentinelController = new SentinelController(
            scene,
            this.fsm,              // ← SentinelFSM concreto
            this.rootNode,
            this.rotationPivot,
            this.barrel,
            meshForPositionTrackName,
            meshForRayCastDetectionName,
        );
        this.controller = this.sentinelController;

        this.projectileManager = new ProjectileManager(scene);

        this.setupShootingLoop();
    }

    // ─────────────────────────────────────────────
    //  CICLO DE VIDA
    // ─────────────────────────────────────────────
    start(): void {
        this.controller.start();
    }

    dispose(): void {
        this.controller.dispose();
        this.fsm.dispose();
        this.rootNode.dispose();
    }

    // ─────────────────────────────────────────────
    //  LOOP DE DISPARO
    // ─────────────────────────────────────────────
    private setupShootingLoop(): void {
        this.scene.onBeforeRenderObservable.add(() => {
            if (this.fsm.getState() !== "shooting") return;

            this.elapsed += this.scene.getEngine().getDeltaTime();
            if (this.elapsed < this.SHOOTING_RATE) return;

            this.elapsed = 0;
            const shot = this.sentinelController.getMuzzlePositionAndDirection();
            if (shot) this.projectileManager.throwProjectile(shot.origin, shot.direction);
        });
    }

    // ─────────────────────────────────────────────
    //  GEOMETRÍA
    // ─────────────────────────────────────────────
    // src/enemies/sentinelV1/SentinelMain.ts
    // reemplazar buildGeometry() completo

    private buildGeometry(): {
        rotationPivot: TransformNode;
        barrel: Mesh;
    } {
        const mat = this.buildMaterial();
        const accentMat = this.buildAccentMaterial();

        const stationMetadata: MeshMetadata = {
            type: meshMetadata.types.enemy,
            enemyClass: meshMetadata.enemyClasses.sentinel,
            stationId: this.uniqueId,
        };

        // ── Grupos ────────────────────────────────
        this.baseGroup = new TransformNode(
            `sentinel_base_group_${this.uniqueId}`, this.scene
        );
        this.baseGroup.parent = this.rootNode;

        this.towerGroup = new TransformNode(
            `sentinel_tower_group_${this.uniqueId}`, this.scene
        );
        this.towerGroup.parent = this.rootNode;

        this.headGroup = new TransformNode(
            `sentinel_head_group_${this.uniqueId}`, this.scene
        );
        this.headGroup.parent = this.rootNode;

        // ── Tracks ────────────────────────────────
        const trackFrontLeft = MeshBuilder.CreateCylinder(
            `sentinel_track_front_left_${this.uniqueId}`,
            { diameter: 0.30, height: 0.5, tessellation: 10 }, this.scene
        );
        trackFrontLeft.rotation.z = Math.PI / 2;
        trackFrontLeft.position = new Vector3(-0.45, 0.15, 0.35);
        trackFrontLeft.material = mat;
        trackFrontLeft.parent = this.baseGroup;
        trackFrontLeft.metadata = stationMetadata;

        const trackFrontRight = MeshBuilder.CreateCylinder(
            `sentinel_track_front_right_${this.uniqueId}`,
            { diameter: 0.30, height: 0.5, tessellation: 10 }, this.scene
        );
        trackFrontRight.rotation.z = Math.PI / 2;
        trackFrontRight.position = new Vector3(0.45, 0.15, 0.35);
        trackFrontRight.material = mat;
        trackFrontRight.parent = this.baseGroup;
        trackFrontRight.metadata = stationMetadata;

        const trackRearLeft = MeshBuilder.CreateCylinder(
            `sentinel_track_rear_left_${this.uniqueId}`,
            { diameter: 0.50, height: 0.5, tessellation: 10 }, this.scene
        );
        trackRearLeft.rotation.z = Math.PI / 2;
        trackRearLeft.position = new Vector3(-0.45, 0.15, -0.35);
        trackRearLeft.material = mat;
        trackRearLeft.parent = this.baseGroup;
        trackRearLeft.metadata = stationMetadata;

        const trackRearRight = MeshBuilder.CreateCylinder(
            `sentinel_track_rear_right_${this.uniqueId}`,
            { diameter: 0.50, height: 0.5, tessellation: 10 }, this.scene
        );
        trackRearRight.rotation.z = Math.PI / 2;
        trackRearRight.position = new Vector3(0.45, 0.15, -0.35);
        trackRearRight.material = mat;
        trackRearRight.parent = this.baseGroup;
        trackRearRight.metadata = stationMetadata;

        const body = MeshBuilder.CreateBox(
            `sentinel_body_${this.uniqueId}`,
            { width: 0.8, height: 0.25, depth: 1.0 }, this.scene
        );
        body.position = new Vector3(0, 0.28, 0);
        body.material = mat;
        body.parent = this.baseGroup;
        body.metadata = stationMetadata;

        const nose = MeshBuilder.CreateBox(
            `sentinel_nose_${this.uniqueId}`,
            { width: 0.3, height: 0.2, depth: 0.3 }, this.scene
        );
        nose.position = new Vector3(0, 0.28, 0.65);
        nose.material = accentMat;
        nose.parent = this.baseGroup;
        nose.metadata = stationMetadata;

        // ── Upper tower ───────────────────────────
        const upperTower = MeshBuilder.CreateCylinder(
            `sentinel_upper_tower_${this.uniqueId}`,
            { diameter: 0.25, height: 1.0, tessellation: 10 }, this.scene
        );
        upperTower.position = new Vector3(0, 0.90, 0);
        upperTower.material = mat;
        upperTower.parent = this.towerGroup;
        upperTower.metadata = stationMetadata;

        // ── Head ──────────────────────────────────
        const head = MeshBuilder.CreateBox(
            `sentinel_head_${this.uniqueId}`,
            { width: 0.45, height: 0.35, depth: 0.45 }, this.scene
        );
        head.position = new Vector3(0, 1.65, 0);
        head.material = mat;
        head.parent = this.headGroup;
        head.metadata = stationMetadata;

        // ── RotationPivot + Barrel ────────────────
        const rotationPivot = new TransformNode(
            `sentinel_rotation_pivot_${this.uniqueId}`, this.scene
        );
        rotationPivot.parent = this.headGroup;
        rotationPivot.position = new Vector3(0, 1.85, 0);

        const barrel = MeshBuilder.CreateCylinder(
            `sentinel_barrel_${this.uniqueId}`,
            { diameter: 0.08, height: 0.5, tessellation: 8 }, this.scene
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position = new Vector3(0, 0, 0.30);
        barrel.material = accentMat;
        barrel.parent = rotationPivot;
        barrel.metadata = stationMetadata;

        // Ensure world transforms are up to date before creating physics shapes.
        this.rootNode.computeWorldMatrix(true);
        this.baseGroup.computeWorldMatrix(true);
        this.towerGroup.computeWorldMatrix(true);
        this.headGroup.computeWorldMatrix(true);
        body.computeWorldMatrix(true);
        upperTower.computeWorldMatrix(true);
        head.computeWorldMatrix(true);

        // física estática — detecta colisiones del frisbee
        this.bodyAggregate = new PhysicsAggregate(
            body,
            PhysicsShapeType.BOX,
            { mass: 0, restitution: 0.1, friction: 0.9 },
            this.scene
        );

        this.towerAggregate = new PhysicsAggregate(
            upperTower,
            PhysicsShapeType.CYLINDER,
            { mass: 0, restitution: 0.1, friction: 0.9 },
            this.scene
        );

        this.headAggregate = new PhysicsAggregate(
            head,
            PhysicsShapeType.BOX,
            { mass: 0, restitution: 0.1, friction: 0.9 },
            this.scene
        );

        this.bodyMesh = body;
        this.upperTowerMesh = upperTower;
        this.headMesh = head;

        // These colliders are driven by gameplay transforms (root/group movement),
        // so they must be ANIMATED to keep broadphase/collision state in sync.
        this.bodyAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
        this.towerAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
        this.headAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
        this.bodyAggregate.body.disablePreStep = false;
        this.towerAggregate.body.disablePreStep = false;
        this.headAggregate.body.disablePreStep = false;

        return { rotationPivot, barrel };
    }

    // ─────────────────────────────────────────────
    //  COLLAPSE
    // ─────────────────────────────────────────────
    private subscribeToHit(): void {
        const observer = this.eventManager.subscribe((event) => {
            if (this.collapsed) return;
            if (event.type !== "enemy_damaged") return;

            const data = event.data as { enemyClass: string; stationId: string };
            if (data.enemyClass !== meshMetadata.enemyClasses.sentinel) return;
            if (data.stationId !== this.uniqueId) return;

            this.eventManager.unsubscribe(observer);
            this.collapse();
        });
    }

    // collapse simplificado
    private collapse(): void {
        this.collapsed = true;
        this.controller.stop();
        this.controller.removeAgent();

        const bodyPos = this.bodyMesh.getAbsolutePosition();
        const towerPos = this.upperTowerMesh.getAbsolutePosition();
        const headPos = this.headMesh.getAbsolutePosition();

        // Reattach decorative meshes to the rigid pieces so they fall together.
        this.baseGroup.getChildMeshes().forEach((m) => {
            if (m !== this.bodyMesh) m.setParent(this.bodyMesh);
        });
        this.towerGroup.getChildMeshes().forEach((m) => {
            if (m !== this.upperTowerMesh) m.setParent(this.upperTowerMesh);
        });
        this.headGroup.getChildMeshes().forEach((m) => {
            if (m !== this.headMesh) m.setParent(this.headMesh);
        });

        // Detach from controller hierarchy so dynamics are not overridden by parent transforms.
        this.bodyMesh.setParent(null);
        this.upperTowerMesh.setParent(null);
        this.headMesh.setParent(null);

        this.bodyMesh.computeWorldMatrix(true);
        this.upperTowerMesh.computeWorldMatrix(true);
        this.headMesh.computeWorldMatrix(true);

        this.bodyAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
        this.towerAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
        this.headAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);

        this.bodyAggregate.body.setMassProperties({ mass: 8 });
        this.towerAggregate.body.setMassProperties({ mass: 4 });
        this.headAggregate.body.setMassProperties({ mass: 2 });

        this.bodyAggregate.body.applyImpulse(
            new Vector3((Math.random() - 0.5) * 3, 1.5, (Math.random() - 0.5) * 3),
            bodyPos
        );
        this.towerAggregate.body.applyImpulse(
            new Vector3((Math.random() - 0.5) * 2, 4, (Math.random() - 0.5) * 2),
            towerPos
        );
        this.headAggregate.body.applyImpulse(
            new Vector3((Math.random() - 0.5) * 5, 6, (Math.random() - 0.5) * 5),
            headPos
        );
    }
    // ─────────────────────────────────────────────
    //  MATERIALES
    // ─────────────────────────────────────────────
    private buildMaterial(): StandardMaterial {
        const mat = new StandardMaterial(`sentinel_mat_${this.uniqueId}`, this.scene);
        mat.diffuseColor = new Color3(0.10, 0.12, 0.20);   // azul-gris oscuro
        mat.emissiveColor = new Color3(0.05, 0.10, 0.35);   // azul-violeta suave
        mat.specularColor = new Color3(0.9, 0.9, 1.0);    // brillo frío
        return mat;
    }

    private buildAccentMaterial(): StandardMaterial {
        const mat = new StandardMaterial(`sentinel_accent_mat_${this.uniqueId}`, this.scene);
        mat.diffuseColor = new Color3(0.0, 0.55, 0.70);   // cian medio
        mat.emissiveColor = new Color3(0.0, 0.70, 0.90);   // cian brillante — nariz + barrel
        return mat;
    }
}