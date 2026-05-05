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
  PhysicsBody,
  PhysicsShapeContainer,
  PhysicsShapeCylinder,
  PhysicsShapeBox,
  Quaternion,
} from "@babylonjs/core";
import { SurveillanceStateMachine } from "./statemachines/SurveillanceStateMachine";
import { SurveillanceController } from "./controllers/SurveillanceController";
import {
  meshMetadata,
  playerConfig,
  surveillanceConfig,
  type MeshMetadata,
  type SurveillanceHeight,
} from "@/config/GameConfig";
import { ProjectileManager } from "./managers/projectileManager";

export class SurveillanceStation {

  private readonly CHARACTER_HEIGHT = playerConfig.height;
  private readonly TURRET_HEIGHT_MULT: number;
  private readonly uniqueId = `surveillance_${Math.random().toString(36).slice(2, 7)}`;

  private lowerAggregate: PhysicsAggregate;
  private upperBody: PhysicsBody;
  private elapsed = 0;


  private barrel: Mesh;
  private upperTowerHeight: number;
  private baseAggregate: PhysicsAggregate;
  private baseMesh: Mesh;
  private lowerMesh: Mesh;
  private rotationPivot: TransformNode;
  private controller: SurveillanceController;
  private static instanceCount = 0;
  private readonly sweepDirection: 1 | -1;


  constructor(
    private scene: Scene,
    private position: Vector3,
    private meshForPositionTrackName: string,
    private meshForRayCastDetectName: string,
    height: SurveillanceHeight = "middle",
  ) {
    this.TURRET_HEIGHT_MULT = surveillanceConfig.heights[height];

    SurveillanceStation.instanceCount++;
    this.sweepDirection = SurveillanceStation.instanceCount % 2 === 0 ? 1 : -1;

    const { lower, upperBody, barrel, rotationPivot, baseMesh, lowerMesh, baseAggregate } =
      this.buildGeometry();
    this.lowerAggregate = lower;
    this.upperBody = upperBody;
    this.barrel = barrel;
    this.baseMesh = baseMesh;       // ← nuevo
    this.lowerMesh = lowerMesh;      // ← nuevo
    this.baseAggregate = baseAggregate;  // ← nuevo
    this.rotationPivot = rotationPivot;

    const stateMachine = new SurveillanceStateMachine(this.uniqueId);

    const controller = new SurveillanceController(
      scene,
      barrel,
      rotationPivot,
      stateMachine,
      meshForPositionTrackName,
      meshForRayCastDetectName,
      this.sweepDirection,   // ← nuevo
    );

    this.controller = controller;

    const projectileManager = new ProjectileManager(scene);

    // Loop de disparo
    scene.onBeforeRenderObservable.add(() => {
      if (stateMachine.getState() !== "alert") return;
      this.elapsed += scene.getEngine().getDeltaTime();
      if (this.elapsed >= surveillanceConfig.shootingRate) {
        this.elapsed = 0;
        const shot = controller.getMuzzlePositionAndDirection();
        if (shot) projectileManager.throwProjectile(shot.origin, shot.direction);
      }
    });

    // Reaccionar al colapso
    stateMachine.onStateChange((state) => {
      if (state === "collapsed") {
        controller.stop();
        this.collapse();
      }
    });

    controller.start();
  }


  dispose(): void {
    // 1. Detener controller — remueve observer y luz
    this.controller.dispose();

    // 2. Física
    this.baseAggregate.dispose();
    this.lowerAggregate.dispose();
    this.upperBody.dispose();

    // 3. Meshes
    this.baseMesh.dispose();
    this.lowerMesh.dispose();
    this.rotationPivot.dispose();  // dispose del pivot elimina barrel (hijo)

    // 4. Limpiar la escena del upperRoot y sus hijos
    const upperRoot = this.upperBody.transformNode;
    if (upperRoot) {
      upperRoot.getChildMeshes().forEach(m => m.dispose());
      upperRoot.dispose();
    }
  }

  // ─────────────────────────────────────────────
  //  COLAPSO
  // ─────────────────────────────────────────────
  private collapse(): void {
    // ✅ Reparentear el barrel al upperRoot antes de activar la física
    this.barrel.parent = this.upperBody.transformNode;
    this.barrel.position = new Vector3(0, this.upperTowerHeight + 0.25, 0.55);

    this.lowerAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
    this.lowerAggregate.body.setMassProperties({ mass: 8 });

    this.upperBody.setMotionType(PhysicsMotionType.DYNAMIC);
    this.upperBody.setMassProperties({ mass: 5 });

    const tiltDirection = new Vector3(
      (Math.random() - 0.5) * 2,
      0,
      (Math.random() - 0.5) * 2,
    ).normalize().scale(3);

    this.upperBody.applyImpulse(
      tiltDirection,
      this.upperBody.transformNode.getAbsolutePosition()
    );
  }

  // ─────────────────────────────────────────────
  //  GEOMETRÍA
  // ─────────────────────────────────────────────
  private buildGeometry(): {
    lower: PhysicsAggregate;
    upperBody: PhysicsBody;
    barrel: Mesh;
    rotationPivot: TransformNode;
    baseMesh: Mesh;        // ← nuevo
    lowerMesh: Mesh;        // ← nuevo
    baseAggregate: PhysicsAggregate; // ← nuevo
  } {
    const turretHeight = this.CHARACTER_HEIGHT * this.TURRET_HEIGHT_MULT;
    const mat = this.buildMaterial();
    const accentMat = this.buildAccentMaterial();

    const stationMetadata: MeshMetadata = {
      type: meshMetadata.types.enemy,
      enemyClass: meshMetadata.enemyClasses.surveillance,
      stationId: this.uniqueId,
    };

    // ── BASE ──────────────────────────────────
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
    const baseAggregate = new PhysicsAggregate(
      base, PhysicsShapeType.CYLINDER,
      { mass: 0, restitution: 0.1, friction: 0.9 },
      this.scene
    );

    // ── TORRE INFERIOR ────────────────────────
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

    // ── PARTE SUPERIOR — compound shape ──────
    const upperTowerHeight = turretHeight * 0.30;
    const upperTowerY = this.position.y + baseHeight + lowerTowerHeight;

    const upperRoot = new TransformNode(`surveillance_upper_root_${this.uniqueId}`, this.scene);
    upperRoot.position.x = this.position.x;
    upperRoot.position.y = upperTowerY;
    upperRoot.position.z = this.position.z;
    upperRoot.metadata = stationMetadata;

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

    // ── ROTATION PIVOT — sin física, libre de rotar ──
    const rotationPivot = new TransformNode(
      `surveillance_rotation_pivot_${this.uniqueId}`,
      this.scene
    );
    rotationPivot.position.x = this.position.x;
    rotationPivot.position.y = upperTowerY + upperTowerHeight;
    rotationPivot.position.z = this.position.z;

    // Barrel — hijo del rotationPivot para rotar libremente
    const barrel = MeshBuilder.CreateCylinder(
      `surveillance_barrel_${this.uniqueId}`,
      { diameter: 0.15, height: 0.8, tessellation: 8 },
      this.scene
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position = new Vector3(0, 0, 0.55);
    barrel.material = accentMat;
    barrel.parent = rotationPivot;
    barrel.metadata = stationMetadata;

    // Compound shape — upperTower + head (barrel no incluido, tiene rotationPivot)
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

    const upperBody = new PhysicsBody(upperRoot, PhysicsMotionType.STATIC, false, this.scene);
    upperBody.shape = upperShape;
    upperBody.setMassProperties({ mass: 0 });
    this.upperTowerHeight = upperTowerHeight;

    return {
      lower: lowerAggregate,
      upperBody,
      barrel,
      rotationPivot,
      baseMesh: base,       // ← nuevo
      lowerMesh: lowerTower, // ← nuevo
      baseAggregate,             // ← nuevo
    };
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