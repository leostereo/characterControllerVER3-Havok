import {
  type Scene,
  type Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  type Vector3,
  PhysicsAggregate,
  PhysicsShapeType,
} from "@babylonjs/core";

interface ProjectileOptions {
  speed:       number;
  radius:      number;
  maxLifetime: number;
}

const DEFAULT_OPTIONS: ProjectileOptions = {
  speed:       500,
  radius:      0.25,
  maxLifetime: 4000,
};

export class ProjectileManager {

  constructor(
    private scene: Scene,
    private options: Partial<ProjectileOptions> = {}
  ) {}

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  throwProjectile(origin: Vector3, direction: Vector3, speed?: number): void {
    const opts = { ...DEFAULT_OPTIONS, ...this.options };
    if (speed) opts.speed = speed;

    const mesh = this.createMesh(opts.radius);
    mesh.position = origin.clone();

    const aggregate = new PhysicsAggregate(
      mesh,
      PhysicsShapeType.SPHERE,
      { mass: 10.5, restitution: 0.0, friction: 0.0 },
      this.scene
    );

    const impulse = direction.scale(opts.speed);
    aggregate.body.applyImpulse(impulse, mesh.getAbsolutePosition());

    // Auto-destruir si no impacta nada
    setTimeout(() => this.destroy(mesh, aggregate), opts.maxLifetime);
  }

  // ─────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────
  private createMesh(radius: number): Mesh {
    const mesh = MeshBuilder.CreateSphere(
      "projectile",
      { diameter: radius * 2, segments: 6 },
      this.scene
    );
    const mat = new StandardMaterial("projectile_mat", this.scene);
    mat.diffuseColor  = new Color3(1.0, 0.4, 0.0);
    mat.emissiveColor = new Color3(1.0, 0.3, 0.0);
    mat.specularColor = new Color3(1,   1,   1);
    mesh.material = mat;
    return mesh;
  }

  private destroy(mesh: Mesh, aggregate: PhysicsAggregate): void {
    if (mesh.isDisposed()) return;
    aggregate.dispose();
    mesh.dispose();
  }
}
