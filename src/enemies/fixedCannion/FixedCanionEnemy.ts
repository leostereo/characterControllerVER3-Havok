import {
  type Scene,
  type Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  type Vector3,
  TransformNode,
  PointLight,
  PhysicsAggregate,
  PhysicsShapeType,
} from "@babylonjs/core";
import { CanionController } from "./controllers/CanionController";
import { CanionManager } from "./managers/CanionManager";
import { meshMetadata, meshNames, playerConfig, enemiesConfig } from "@/config/GameConfig";
import { CanionStateMachine } from "./stateMachines/CanionStateMachine";

export class FixedCanionEnemy {

  private readonly CHARACTER_HEIGHT = playerConfig.height;
  private readonly TURRET_HEIGHT_MULT = enemiesConfig.canion.turretHeightMult;
  private readonly uniqueId = `canion_${Math.random().toString(36).slice(2, 7)}`;

  constructor(
    private scene: Scene,
    private position: Vector3,
    private meshToShootName: string,
  ) {
    const {
      barrelPivot,
      muzzleMesh,
      bodyMesh,
      baseMesh,
      barrelMesh,
      searchLight,
      bodyAggregate,
      baseAggregate,
      barrelAggregate,
      muzzleAggregate,
    } = this.buildCanionGeometry();

    const stateMachine = new CanionStateMachine();

    const controller = new CanionController(
      scene,
      muzzleMesh,
      barrelPivot,
      stateMachine,
      meshToShootName,
    );

    const manager = new CanionManager(
      scene,
      bodyMesh,
      baseMesh,
      barrelMesh,
      barrelPivot,
      searchLight,
      bodyAggregate,
      baseAggregate,
      barrelAggregate,
      muzzleAggregate,
      stateMachine,
      controller,
      this.uniqueId,
    );

    controller.start();
    manager.initialize();
  }

  // ─────────────────────────────────────────────
  //  GEOMETRÍA
  // ─────────────────────────────────────────────
  private buildCanionGeometry(): {
    barrelPivot: TransformNode;
    muzzleMesh: Mesh;
    bodyMesh: Mesh;
    baseMesh: Mesh;
    barrelMesh: Mesh;           // ← nuevo
    searchLight: PointLight;
    bodyAggregate: PhysicsAggregate;
    baseAggregate: PhysicsAggregate;    // ← nuevo
    barrelAggregate: PhysicsAggregate;  // ← nuevo
    muzzleAggregate: PhysicsAggregate;  // ← nuevo
  } {
    const root = new TransformNode(`${meshNames.canionRoot}_${this.uniqueId}`, this.scene);
    root.position = this.position;

    const turretHeight = this.CHARACTER_HEIGHT * this.TURRET_HEIGHT_MULT;
    const mat = this.buildMaterial();
    const muzzleMat = this.buildMuzzleMaterial();

    const baseHeight = turretHeight * 0.15;
    const base = MeshBuilder.CreateCylinder(
      `${meshNames.canionBase}_${this.uniqueId}`,
      { diameter: 1.4, height: baseHeight, tessellation: 16 },
      this.scene
    );
    base.position.y = baseHeight / 2;
    base.material = mat;
    base.parent = root;

    // ← NUEVO: Agregar física a la base
    const baseAggregate = new PhysicsAggregate(
      base,
      PhysicsShapeType.CYLINDER,
      { mass: 2, restitution: 0.5, friction: 0.8 },
      this.scene
    );

    const bodyHeight = turretHeight * 0.40;
    const bodyMesh = MeshBuilder.CreateCylinder(
      `${meshNames.canionBody}_${this.uniqueId}`,
      { diameter: 0.9, height: bodyHeight, tessellation: 16 },
      this.scene
    );
    bodyMesh.position.y = baseHeight + bodyHeight / 2;
    bodyMesh.material = mat;
    bodyMesh.parent = root;
    bodyMesh.metadata = {
      type: meshMetadata.types.enemy,
      enemyClass: meshMetadata.enemyClasses.canion,
      canionId: this.uniqueId,
    };

    const bodyAggregate = new PhysicsAggregate(
      bodyMesh,
      PhysicsShapeType.CYLINDER,
      { mass: 3, restitution: 0.3, friction: 0.5 },
      this.scene
    );

    const barrelPivot = new TransformNode(`${meshNames.canionPivot}_${this.uniqueId}`, this.scene);
    barrelPivot.position.y = baseHeight + bodyHeight;
    barrelPivot.parent = root;

    const barrel = MeshBuilder.CreateCylinder(
      `${meshNames.canionBarrel}_${this.uniqueId}`,
      { diameter: 0.22, height: 1.1, tessellation: 12 },
      this.scene
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.55;
    barrel.material = mat;
    barrel.parent = barrelPivot;
    barrel.metadata = bodyMesh.metadata;

    // ← NUEVO: Agregar física al cañón
    const barrelAggregate = new PhysicsAggregate(
      barrel,
      PhysicsShapeType.CYLINDER,
      { mass: 1.5, restitution: 0.4, friction: 0.6 },
      this.scene
    );

    const muzzleMesh = MeshBuilder.CreateTorus(
      `${meshNames.canionMuzzle}_${this.uniqueId}`,
      { diameter: 0.32, thickness: 0.07, tessellation: 16 },
      this.scene
    );
    muzzleMesh.rotation.x = Math.PI / 2;
    muzzleMesh.position.z = 1.15;
    muzzleMesh.material = muzzleMat;
    muzzleMesh.parent = barrelPivot;
    muzzleMesh.metadata = bodyMesh.metadata;

    // ← NUEVO: Agregar física a la boca del cañón
    const muzzleAggregate = new PhysicsAggregate(
      muzzleMesh,
      PhysicsShapeType.SPHERE,
      { mass: 0.5, restitution: 0.3, friction: 0.5 },
      this.scene
    );

    const searchLight = new PointLight(`canio_search_light_${this.uniqueId}`, this.position.clone(), this.scene);
    searchLight.position.y += this.CHARACTER_HEIGHT * this.TURRET_HEIGHT_MULT;
    searchLight.intensity = 0.8;
    searchLight.range = 6;
    searchLight.diffuse = new Color3(1.0, 0.9, 0.0);

    return {
      barrelPivot,
      muzzleMesh,
      bodyMesh,
      baseMesh: base,
      barrelMesh: barrel,           // ← nuevo
      searchLight,
      bodyAggregate,
      baseAggregate,                // ← nuevo
      barrelAggregate,              // ← nuevo
      muzzleAggregate,              // ← nuevo
    };
  }

  // ─────────────────────────────────────────────
  //  MATERIALES
  // ─────────────────────────────────────────────
  private buildMaterial(): StandardMaterial {
    const mat = new StandardMaterial(`${meshNames.canionBody}_mat`, this.scene);
    mat.diffuseColor = new Color3(0.08, 0.10, 0.14);
    mat.emissiveColor = new Color3(0.0, 0.25, 0.55);
    mat.specularColor = new Color3(1, 1, 1);
    return mat;
  }

  private buildMuzzleMaterial(): StandardMaterial {
    const mat = new StandardMaterial(`${meshNames.canionMuzzle}_mat`, this.scene);
    mat.diffuseColor = new Color3(0, 0.6, 0.9);
    mat.emissiveColor = new Color3(0, 0.5, 1.0);
    return mat;
  }
}
