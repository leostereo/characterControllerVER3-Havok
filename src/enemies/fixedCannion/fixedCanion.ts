import {
  type Scene,
  type Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
  PointLight,
  Ray,
  PhysicsAggregate,
  PhysicsShapeType,
  type Observer,
} from "@babylonjs/core";
import { EventManager, type GameEvent } from "@/game/eventManager/eventManager";
import {
  enemiesConfig,
  meshMetadata,
  meshNames,
  playerConfig,
} from "@/config/GameConfig";
import { ProjectileManager } from "./managers/projectileManager";
import { ParticlesManager } from "@/game/effects/ParticlesManager";

type CanionState = "alert" | "searching";

export class FixedCanionEnemy {

  // ─────────────────────────────────────────────
  //  CONFIGURACIÓN
  // ─────────────────────────────────────────────
  private readonly SHOOTING_RATE = enemiesConfig.canion.shootingRate;
  private readonly TURRET_HEIGHT_MULT = enemiesConfig.canion.turretHeightMult;
  private readonly AIM_HEIGHT_MULT = enemiesConfig.canion.aimHeightMult;
  private readonly CHARACTER_HEIGHT = playerConfig.height;
  private readonly SEARCH_ROTATE_SPEED = enemiesConfig.canion.searchRotateSpeed;

  // ─────────────────────────────────────────────
  //  ESTADO
  // ─────────────────────────────────────────────
  private state: CanionState = "searching";
  private elapsed = 0;
  private isDestroyed = false;

  // ─────────────────────────────────────────────
  //  REFERENCIAS
  // ─────────────────────────────────────────────
  private barrelPivot: TransformNode;
  private muzzleMesh: Mesh;
  private bodyMesh: Mesh;
  private searchLight: PointLight;
  private renderObserver: Observer<GameEvent> | null;
  private projectileManager: ProjectileManager;
  private eventManager = EventManager.getInstance();
  private particlesManager: ParticlesManager = ParticlesManager.getInstance();
  private canionBodyAggregate: PhysicsAggregate;

  constructor(
    private scene: Scene,
    private position: Vector3,
    private meshToShootName: string,
  ) {
    this.projectileManager = new ProjectileManager(scene);

    const { barrelPivot, muzzleMesh, bodyMesh, canionBodyAggregate } = this.buildCanionGeometry();
    this.barrelPivot = barrelPivot;
    this.muzzleMesh = muzzleMesh;
    this.bodyMesh = bodyMesh;
    this.searchLight = this.buildSearchLight();
    this.canionBodyAggregate = canionBodyAggregate;

    this.subscribeToHit();
    this.go_into_alertState();
  }

  // ─────────────────────────────────────────────
  //  ESTADO ALERTA
  // ─────────────────────────────────────────────
  go_into_alertState(): void {
    this.elapsed = 0;

      this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
      const dt = this.scene.getEngine().getDeltaTime();
      const playerInSight = this.hasLineOfSight();

      if (playerInSight) {
        this.enterAlert();
        this.elapsed += dt;
        if (this.elapsed >= this.SHOOTING_RATE) {
          this.elapsed = 0;
          this.shoot();
        }
      } else {
        this.enterSearching(dt);
      }
    });
  }

  private enterAlert(): void {
    if (this.state === "alert") return;
    this.state = "alert";

    this.applyStateColor(new Color3(0.8, 0.1, 0.0), new Color3(1.0, 0.2, 0.0));
    this.searchLight.diffuse = new Color3(1.0, 0.2, 0.0);
    this.searchLight.intensity = 1.2;
  }

  private enterSearching(dt: number): void {
    if (this.state !== "searching") {
      this.state = "searching";
      this.applyStateColor(new Color3(0.4, 0.35, 0.0), new Color3(0.8, 0.7, 0.0));
      this.searchLight.diffuse = new Color3(1.0, 0.9, 0.0);
      this.searchLight.intensity = 0.8;
    }

    this.barrelPivot.rotation.y += this.SEARCH_ROTATE_SPEED * (dt / 1000);
  }

  // ─────────────────────────────────────────────
  //  LINE OF SIGHT
  // ─────────────────────────────────────────────
  private hasLineOfSight(): boolean {
    const target = this.scene.getMeshByName(this.meshToShootName);
    if (!target) return false;

    const aimHeight = this.CHARACTER_HEIGHT * this.AIM_HEIGHT_MULT;
    const aimTarget = target.position.add(new Vector3(0, aimHeight, 0));
    const origin = this.muzzleMesh.getAbsolutePosition();
    const direction = aimTarget.subtract(origin).normalize();
    const distance = Vector3.Distance(origin, aimTarget);

    const ray = new Ray(origin, direction, distance);
    const hit = this.scene.pickWithRay(ray, (mesh) =>
      mesh.name !== meshNames.canionMuzzle &&
      mesh.name !== meshNames.canionBarrel &&
      mesh.name !== meshNames.canionPivot &&
      mesh.name !== meshNames.projectile
    );

    return hit?.pickedMesh?.name === playerConfig.player1.player1Raycast;
  }

  // ─────────────────────────────────────────────
  //  DISPARO
  // ─────────────────────────────────────────────
  private shoot(): void {
    const target = this.scene.getMeshByName(this.meshToShootName);
    if (!target) return;

    const aimHeight = this.CHARACTER_HEIGHT * this.AIM_HEIGHT_MULT;
    const aimTarget = target.position.add(new Vector3(0, aimHeight, 0));
    const origin = this.muzzleMesh.getAbsolutePosition();
    const direction = aimTarget.subtract(origin).normalize();

    this.rotateBarrelToward(direction);
    this.projectileManager.throwProjectile(origin, direction);
  }

  private rotateBarrelToward(direction: Vector3): void {
    const angle = Math.atan2(direction.x, direction.z);
    this.barrelPivot.rotation.y = angle;
  }

  // ─────────────────────────────────────────────
  //  DESTRUCCIÓN
  // ─────────────────────────────────────────────
  private subscribeToHit(): void {
    const observer = this.eventManager.subscribe((event) => {

      if (this.isDestroyed) return;
      if (event.type !== "enemy_damaged") return;

      const data = event.data as { enemyClass: string };
      if (data.enemyClass !== meshMetadata.enemyClasses.canion) return;

      this.eventManager.unsubscribe(observer);
      this.destroy();
    });
  }

  private destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.scene.onBeforeRenderObservable.remove(this.renderObserver);

    this.particlesManager.generateCanionDestruction(
      this.muzzleMesh.getAbsolutePosition()
    );

    this.bodyMesh.setEnabled(false);
    this.barrelPivot.setEnabled(false);
    this.searchLight.setEnabled(false);

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

  // ─────────────────────────────────────────────
  //  HELPERS VISUALES
  // ─────────────────────────────────────────────
  private applyStateColor(diffuse: Color3, emissive: Color3): void {
    const mat = this.bodyMesh.material as StandardMaterial;
    if (!mat) return;
    mat.diffuseColor = diffuse;
    mat.emissiveColor = emissive;
  }

  private buildSearchLight(): PointLight {
    const light = new PointLight("canio_search_light", this.position.clone(), this.scene);
    light.position.y += this.CHARACTER_HEIGHT * this.TURRET_HEIGHT_MULT;
    light.intensity = 0.8;
    light.range = 6;
    light.diffuse = new Color3(1.0, 0.9, 0.0);
    return light;
  }

  // ─────────────────────────────────────────────
  //  GEOMETRÍA
  // ─────────────────────────────────────────────
  private buildCanionGeometry(): { barrelPivot: TransformNode; muzzleMesh: Mesh; bodyMesh: Mesh; canionBodyAggregate: PhysicsAggregate } {
    const root = new TransformNode(meshNames.canionRoot, this.scene);
    root.position = this.position;

    const turretHeight = this.CHARACTER_HEIGHT * this.TURRET_HEIGHT_MULT;
    const mat = this.buildMaterial();
    const muzzleMat = this.buildMuzzleMaterial();

    const baseHeight = turretHeight * 0.15;
    const base = MeshBuilder.CreateCylinder(
      meshNames.canionBase,
      { diameter: 1.4, height: baseHeight, tessellation: 16 },
      this.scene
    );
    base.position.y = baseHeight / 2;
    base.material = mat;
    base.parent = root;

    const bodyHeight = turretHeight * 0.40;
    const bodyMesh = MeshBuilder.CreateCylinder(
      meshNames.canionBody,
      { diameter: 0.9, height: bodyHeight, tessellation: 16 },
      this.scene
    );
    bodyMesh.position.y = baseHeight + bodyHeight / 2;
    bodyMesh.material = mat;
    bodyMesh.parent = root;

    const canionBodyAggregate = new PhysicsAggregate(
      bodyMesh,
      PhysicsShapeType.CYLINDER,
      { mass: 0, restitution: 0.3, friction: 0.5 },  // mass: 0 = estático, no se mueve
      this.scene
    );

    // Metadata — identifica este mesh como enemigo para el raycast del frisbee
    bodyMesh.metadata = {
      type: meshMetadata.types.enemy,
      enemyClass: meshMetadata.enemyClasses.canion,
    };

    const barrelPivot = new TransformNode(meshNames.canionPivot, this.scene);
    barrelPivot.position.y = baseHeight + bodyHeight;
    barrelPivot.parent = root;

    const barrel = MeshBuilder.CreateCylinder(
      meshNames.canionBarrel,
      { diameter: 0.22, height: 1.1, tessellation: 12 },
      this.scene
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.55;
    barrel.material = mat;
    barrel.parent = barrelPivot;
    barrel.metadata = bodyMesh.metadata;

    const muzzleMesh = MeshBuilder.CreateTorus(
      meshNames.canionMuzzle,
      { diameter: 0.32, thickness: 0.07, tessellation: 16 },
      this.scene
    );
    muzzleMesh.rotation.x = Math.PI / 2;
    muzzleMesh.position.z = 1.15;
    muzzleMesh.material = muzzleMat;
    muzzleMesh.parent = barrelPivot;
    muzzleMesh.metadata = bodyMesh.metadata;

    return { barrelPivot, muzzleMesh, bodyMesh, canionBodyAggregate };
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