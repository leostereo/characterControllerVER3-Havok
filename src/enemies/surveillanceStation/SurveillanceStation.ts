
import {
    type Scene,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Vector3,
    TransformNode,
    PhysicsAggregate,
    PhysicsShapeType,
    PhysicsMotionType,
    PhysicsBody,
    PhysicsShapeContainer,
    PhysicsShapeCylinder,
    PhysicsShapeBox,
    Quaternion,
} from "@babylonjs/core";
import { playerConfig, meshMetadata, type MeshMetadata, type SurveillanceHeight, surveillanceConfig } from "@/config/GameConfig";
import { EventManager } from "@/game/eventManager/eventManager";

export class SurveillanceStation {

    private readonly CHARACTER_HEIGHT = playerConfig.height;
    private readonly TURRET_HEIGHT_MULT: number;
    private readonly uniqueId = `surveillance_${Math.random().toString(36).slice(2, 7)}`;

    // ─────────────────────────────────────────────
    //  PARTES FÍSICAS
    // ─────────────────────────────────────────────
    private lowerAggregate: PhysicsAggregate;  // base + mitad inferior de torre
    // private upperAggregate: PhysicsAggregate;  // mitad superior + cañón
    private upperBody: PhysicsBody;
    private isCollapsed = false;
    private eventManager = EventManager.getInstance();

    constructor(
        private scene: Scene,
        private position: Vector3,
        height: SurveillanceHeight = "middle",   // ← nuevo parámetro con default

    ) {
        this.TURRET_HEIGHT_MULT = surveillanceConfig.heights[height];

        const { lower, upperBody } = this.buildGeometry();
        this.lowerAggregate = lower;
        this.upperBody = upperBody;
        this.subscribeToHit();

    }

    private subscribeToHit(): void {
        const observer = this.eventManager.subscribe((event) => {
            if (this.isCollapsed) return;
            if (event.type !== "enemy_damaged") return;

            const data = event.data as { enemyClass: string; stationId: string };
            if (data.enemyClass !== meshMetadata.enemyClasses.surveillance) return;
            if (data.stationId !== this.uniqueId) return;

            this.eventManager.unsubscribe(observer);

            this.collapse();
        });
    }


    // ─────────────────────────────────────────────
    //  GEOMETRÍA
    // ─────────────────────────────────────────────

    private buildGeometry(): {
        lower: PhysicsAggregate;
        upperBody: PhysicsBody;
    } {
        const turretHeight = this.CHARACTER_HEIGHT * this.TURRET_HEIGHT_MULT;
        const mat = this.buildMaterial();
        const accentMat = this.buildAccentMaterial();

        const stationMetadata: MeshMetadata = {
            type: meshMetadata.types.enemy,
            enemyClass: meshMetadata.enemyClasses.surveillance,
            stationId: this.uniqueId,
        };

        // ── PARTE INFERIOR ────────────────────────────────────────
        const baseHeight = turretHeight * 0.12;
        const base = MeshBuilder.CreateCylinder(
            `surveillance_base_${this.uniqueId}`,
            { diameter: 1.6, height: baseHeight, tessellation: 16 },
            this.scene
        );
        base.position = this.position.clone();
        base.position.y += baseHeight / 2;
        base.material = mat;
        base.metadata = stationMetadata;

        new PhysicsAggregate(
            base,
            PhysicsShapeType.CYLINDER,
            { mass: 0, restitution: 0.1, friction: 0.9 },
            this.scene
        );

        const lowerTowerHeight = turretHeight * 0.45;
        const lowerTower = MeshBuilder.CreateCylinder(
            `surveillance_lower_tower_${this.uniqueId}`,
            { diameter: 0.5, height: lowerTowerHeight, tessellation: 12 },
            this.scene
        );
        lowerTower.position = this.position.clone();
        lowerTower.position.y += baseHeight + lowerTowerHeight / 2;
        lowerTower.material = mat;
        lowerTower.metadata = stationMetadata;

        const lowerAggregate = new PhysicsAggregate(
            lowerTower,
            PhysicsShapeType.CYLINDER,
            { mass: 0, restitution: 0.1, friction: 0.9 },
            this.scene
        );

        // ── PARTE SUPERIOR — compound shape ──────────────────────
        const upperTowerHeight = turretHeight * 0.30;
        const upperTowerY = this.position.y + baseHeight + lowerTowerHeight;

        const upperRoot = new TransformNode(`surveillance_upper_root_${this.uniqueId}`, this.scene);
        upperRoot.position.x = this.position.x;
        upperRoot.position.y = upperTowerY;
        upperRoot.position.z = this.position.z;
        upperRoot.metadata = stationMetadata;   // ← único cambio nuevo

        const upperTower = MeshBuilder.CreateCylinder(
            `surveillance_upper_tower_${this.uniqueId}`,
            { diameter: 0.4, height: upperTowerHeight, tessellation: 12 },
            this.scene
        );
        upperTower.position = new Vector3(0, upperTowerHeight / 2, 0);
        upperTower.material = mat;
        upperTower.parent = upperRoot;
        upperTower.metadata = stationMetadata;

        const head = MeshBuilder.CreateBox(
            `surveillance_head_${this.uniqueId}`,
            { width: 0.7, height: 0.5, depth: 0.7 },
            this.scene
        );
        head.position = new Vector3(0, upperTowerHeight + 0.25, 0);
        head.material = mat;
        head.parent = upperRoot;
        head.metadata = stationMetadata;

        const barrel = MeshBuilder.CreateCylinder(
            `surveillance_barrel_${this.uniqueId}`,
            { diameter: 0.15, height: 0.8, tessellation: 8 },
            this.scene
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position = new Vector3(0, upperTowerHeight + 0.25, 0.55);
        barrel.material = accentMat;
        barrel.parent = upperRoot;
        barrel.metadata = stationMetadata;

        const upperShape = new PhysicsShapeContainer(this.scene);

        upperShape.addChildFromParent(
            upperRoot,
            new PhysicsShapeCylinder(
                new Vector3(0, 0, 0),
                new Vector3(0, upperTowerHeight, 0),
                0.2,
                this.scene
            ),
            upperTower
        );

        upperShape.addChildFromParent(
            upperRoot,
            new PhysicsShapeBox(
                new Vector3(0, upperTowerHeight + 0.25, 0),
                Quaternion.Identity(),
                new Vector3(0.7, 0.5, 0.7),
                this.scene
            ),
            head
        );

        upperShape.addChildFromParent(
            upperRoot,
            new PhysicsShapeCylinder(
                new Vector3(0, upperTowerHeight + 0.15, 0.55),
                new Vector3(0, upperTowerHeight + 0.35, 0.55),
                0.075,
                this.scene
            ),
            barrel
        );

        const upperBody = new PhysicsBody(
            upperRoot,
            PhysicsMotionType.STATIC,
            false,
            this.scene
        );
        upperBody.shape = upperShape;
        upperBody.setMassProperties({ mass: 0 });

        return { lower: lowerAggregate, upperBody };
    }


    // ─────────────────────────────────────────────
    //  COLAPSO
    // ─────────────────────────────────────────────
    collapse(): void {
        if (this.isCollapsed) return;
        this.isCollapsed = true;


        // Parte inferior
        this.lowerAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
        this.lowerAggregate.body.setMassProperties({ mass: 8 });

        // Parte superior
        this.upperBody.setMotionType(PhysicsMotionType.DYNAMIC);
        this.upperBody.setMassProperties({ mass: 5 });

        // ✅ Usar el transformNode guardado como referencia directa
        const upperRootNode = this.upperBody.transformNode;

        if (!upperRootNode) {
            return;
        }

        const tiltDirection = new Vector3(
            (Math.random() - 0.5) * 2,
            0,
            (Math.random() - 0.5) * 2,
        ).normalize().scale(3);


        this.upperBody.applyImpulse(
            tiltDirection,
            upperRootNode.getAbsolutePosition()
        );

    }

    // ─────────────────────────────────────────────
    //  MATERIALES
    // ─────────────────────────────────────────────
    private buildMaterial(): StandardMaterial {
        const mat = new StandardMaterial(`surveillance_mat_${this.uniqueId}`, this.scene);
        mat.diffuseColor = new Color3(0.12, 0.14, 0.18);
        mat.emissiveColor = new Color3(0.0, 0.15, 0.40);
        mat.specularColor = new Color3(1, 1, 1);
        return mat;
    }

    private buildAccentMaterial(): StandardMaterial {
        const mat = new StandardMaterial(`surveillance_accent_mat_${this.uniqueId}`, this.scene);
        mat.diffuseColor = new Color3(0, 0.5, 0.8);
        mat.emissiveColor = new Color3(0, 0.4, 0.9);
        return mat;
    }
}
