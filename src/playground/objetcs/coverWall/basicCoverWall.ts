import { coverWallConfig } from "@/config/GameConfig";
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

interface CoverWallOptions {
  width: number;  // ancho del muro
  height: number;  // altura del muro
  depth: number;  // grosor del muro
}

const DEFAULT_OPTIONS: CoverWallOptions = {
  width: coverWallConfig.width,
  height: coverWallConfig.height,  // suficiente para cubrir al personaje agachado/parado
  depth: coverWallConfig.depth,
};

export class BasicCoverWall {

  private mesh: Mesh;
  private aggregate: PhysicsAggregate;

  constructor(
    private scene: Scene,
    private position: Vector3,
    private options: Partial<CoverWallOptions> = {},
    rotationY = 0,    // para orientar el muro hacia el cañón
  ) {
    const opts = { ...DEFAULT_OPTIONS, ...this.options };

    this.mesh = this.buildGeometry(opts);
    this.mesh.position = position.clone();
    this.mesh.position.y = opts.height / 2; // apoyado en el suelo
    this.mesh.rotation.y = rotationY;
    this.mesh.material = this.buildMaterial();

    // Físicas estáticas — mass: 0 = no se mueve, pero rebota proyectiles
    this.aggregate = new PhysicsAggregate(
      this.mesh,
      PhysicsShapeType.BOX,
      { mass: 0, restitution: 0.6, friction: 0.4 },
      this.scene
    );
  }

  // ─────────────────────────────────────────────
  //  GEOMETRÍA
  // ─────────────────────────────────────────────
  private buildGeometry(opts: CoverWallOptions): Mesh {
    const root = MeshBuilder.CreateBox(
      "cover_wall",
      { width: opts.width, height: opts.height, depth: opts.depth },
      this.scene
    );

    // Detalle: bordes superiores con tubos sci-fi
    const edgeLeft = this.buildEdgePipe(opts.height);
    const edgeRight = this.buildEdgePipe(opts.height);
    const edgeTop = this.buildEdgePipe(opts.width);

    edgeLeft.position.x = -(opts.width / 2);
    edgeRight.position.x = (opts.width / 2);

    edgeTop.rotation.z = Math.PI / 2;
    edgeTop.position.y = (opts.height / 2);

    edgeLeft.parent = root;
    edgeRight.parent = root;
    edgeTop.parent = root;

    const pipeMat = this.buildPipeMaterial();
    edgeLeft.material = pipeMat;
    edgeRight.material = pipeMat;
    edgeTop.material = pipeMat;

    return root;
  }

  private buildEdgePipe(height: number): Mesh {
    return MeshBuilder.CreateCylinder(
      "cover_edge",
      { diameter: 0.08, height, tessellation: 8 },
      this.scene
    );
  }

  // ─────────────────────────────────────────────
  //  MATERIALES
  // ─────────────────────────────────────────────
  private buildMaterial(): StandardMaterial {
    const mat = new StandardMaterial("cover_wall_mat", this.scene);
    mat.diffuseColor = new Color3(0.07, 0.09, 0.13); // gris oscuro azulado
    mat.emissiveColor = new Color3(0.0, 0.15, 0.35); // brillo azul tenue
    mat.specularColor = new Color3(0.8, 0.8, 0.8);
    mat.alpha = 0.92;                          // ligeramente translúcido
    return mat;
  }

  private buildPipeMaterial(): StandardMaterial {
    const mat = new StandardMaterial("cover_pipe_mat", this.scene);
    mat.diffuseColor = new Color3(0, 0.5, 0.9);
    mat.emissiveColor = new Color3(0, 0.4, 1.0); // tubos cyan brillantes
    return mat;
  }

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  dispose(): void {
    this.aggregate.dispose();
    this.mesh.dispose();
  }

  get wallMesh(): Mesh { return this.mesh; }
}