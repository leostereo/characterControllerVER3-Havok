import {
  type Scene,
  type Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
} from "@babylonjs/core";
import { ProjectileManager } from "./managers/projectileManager";

export class FixedCanionEnemy {

  // ─────────────────────────────────────────────
  //  CONFIGURACIÓN
  // ─────────────────────────────────────────────
  private readonly PROJECTILE_SHOOTING_RATE = 2000;

  private readonly CHARACTER_HEIGHT         = 1.8;
  // Multiplicador para la altura de la torreta respecto al personaje
  private readonly TURRET_HEIGHT_MULTIPLIER = 1.2;
  // Fracción de la altura del personaje a la que apunta (ej: 0.5 = cintura)
  private readonly AIM_HEIGHT_MULTIPLIER    = 0.6;

  private barrelPivot: TransformNode;
  private muzzleMesh:  Mesh;
  private projectileManager: ProjectileManager;
  private elapsed = 0;

  constructor(
    private scene:            Scene,
    private position:         Vector3,
    private meshToShootName:  string,
  ) {
    this.projectileManager = new ProjectileManager(scene);

    const { barrelPivot, muzzleMesh } = this.buildCanionGeometry();
    this.barrelPivot = barrelPivot;
    this.muzzleMesh  = muzzleMesh;

    this.go_into_alertState();
  }

  // ─────────────────────────────────────────────
  //  ESTADO ALERTA
  // ─────────────────────────────────────────────
  go_into_alertState(): void {
    this.elapsed = 0;

    this.scene.onBeforeRenderObservable.add(() => {
      this.elapsed += this.scene.getEngine().getDeltaTime();

      if (this.elapsed >= this.PROJECTILE_SHOOTING_RATE) {
        this.elapsed = 0;
        this.shoot();
      }
    });
  }

  // ─────────────────────────────────────────────
  //  DISPARO
  // ─────────────────────────────────────────────
  private shoot(): void {
    const target = this.scene.getMeshByName(this.meshToShootName);
    if (!target) return;

    // Apunta al centro de masa del personaje, no a sus pies
    const aimHeight  = this.CHARACTER_HEIGHT * this.AIM_HEIGHT_MULTIPLIER;
    const aimTarget  = target.position.add(new Vector3(0, aimHeight, 0));

    const origin     = this.muzzleMesh.getAbsolutePosition();
    const direction  = aimTarget.subtract(origin).normalize();

    this.rotateBarrelToward(direction);
    this.projectileManager.throwProjectile(origin, direction);
  }

  private rotateBarrelToward(direction: Vector3): void {
    const angle = Math.atan2(direction.x, direction.z);
    this.barrelPivot.rotation.y = angle;
  }

  // ─────────────────────────────────────────────
  //  GEOMETRÍA
  // ─────────────────────────────────────────────
  private buildCanionGeometry(): { barrelPivot: TransformNode; muzzleMesh: Mesh } {
    const root = new TransformNode("canio_root", this.scene);
    root.position = this.position;

    // Altura total de la torreta basada en el personaje
    const turretHeight = this.CHARACTER_HEIGHT * this.TURRET_HEIGHT_MULTIPLIER;

    const mat       = this.buildMaterial();
    const muzzleMat = this.buildMuzzleMaterial();

    // Base — 15% de la altura total
    const baseHeight = turretHeight * 0.15;
    const base = MeshBuilder.CreateCylinder(
      "canio_base",
      { diameter: 1.4, height: baseHeight, tessellation: 16 },
      this.scene
    );
    base.position.y = baseHeight / 2;
    base.material   = mat;
    base.parent     = root;

    // Cuerpo — 40% de la altura total
    const bodyHeight = turretHeight * 0.40;
    const body = MeshBuilder.CreateCylinder(
      "canio_body",
      { diameter: 0.9, height: bodyHeight, tessellation: 16 },
      this.scene
    );
    body.position.y = baseHeight + bodyHeight / 2;
    body.material   = mat;
    body.parent     = root;

    // Pivot — en la cima del cuerpo
    const barrelPivot = new TransformNode("canio_barrel_pivot", this.scene);
    barrelPivot.position.y = baseHeight + bodyHeight;
    barrelPivot.parent     = root;

    // Cañón
    const barrel = MeshBuilder.CreateCylinder(
      "canio_barrel",
      { diameter: 0.22, height: 1.1, tessellation: 12 },
      this.scene
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.55;
    barrel.material   = mat;
    barrel.parent     = barrelPivot;

    // Boca del cañón
    const muzzleMesh = MeshBuilder.CreateTorus(
      "canio_muzzle",
      { diameter: 0.32, thickness: 0.07, tessellation: 16 },
      this.scene
    );
    muzzleMesh.rotation.x = Math.PI / 2;
    muzzleMesh.position.z = 1.15;
    muzzleMesh.material   = muzzleMat;
    muzzleMesh.parent     = barrelPivot;

    return { barrelPivot, muzzleMesh };
  }

  // ─────────────────────────────────────────────
  //  MATERIALES
  // ─────────────────────────────────────────────
  private buildMaterial(): StandardMaterial {
    const mat = new StandardMaterial("canio_mat", this.scene);
    mat.diffuseColor  = new Color3(0.08, 0.10, 0.14);
    mat.emissiveColor = new Color3(0.0,  0.25, 0.55);
    mat.specularColor = new Color3(1,    1,    1);
    return mat;
  }

  private buildMuzzleMaterial(): StandardMaterial {
    const mat = new StandardMaterial("canio_muzzle_mat", this.scene);
    mat.diffuseColor  = new Color3(0,   0.6, 0.9);
    mat.emissiveColor = new Color3(0,   0.5, 1.0);
    return mat;
  }
}
