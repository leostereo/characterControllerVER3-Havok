import {
  type Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import {
  wallShapes,
  unitBlockConfig,
  wallsBuilderConfig,
  type ShapeName,
} from "@/config/GameConfig";

export class WallGroup {

  private _mesh: Mesh | null = null;

  readonly shapeA: ShapeName;
  readonly shapeB: ShapeName;
  readonly rotA:   number;
  readonly rotB:   number;

  constructor(private scene: Scene) {
    this.shapeA = this.randomTetrisShape();
    this.shapeB = this.randomTetrisShape();
    this.rotA   = this.randomRotStep();
    this.rotB   = this.randomRotStep();
  }

  // ─────────────────────────────────────────────
  //  CONSTRUCCIÓN
  // ─────────────────────────────────────────────

  build(tramLength: number): void {
    this._mesh?.dispose();
    this._mesh = null;

    const s      = unitBlockConfig.size;
    const heights = wallsBuilderConfig.wallHeights;
    const h       = heights[Math.floor(Math.random() * heights.length)] * s;
    const meshes: Mesh[] = [];
    let cursorX  = 0;

    // Figura A
    const matA = this.rotateMatrix(wallShapes[this.shapeA], this.rotA);
    cursorX    = this.placeFigure(matA, cursorX, s, h, meshes);

    // Tramo I
    for (let i = 0; i < tramLength; i++) {
      meshes.push(this.makeBlock(cursorX, 0, s, h));
      cursorX++;
    }

    // Figura B
    const matB = this.rotateMatrix(wallShapes[this.shapeB], this.rotB);
    this.placeFigure(matB, cursorX, s, h, meshes);

    // Centrar antes del merge
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    meshes.forEach(m => {
      minX = Math.min(minX, m.position.x);
      maxX = Math.max(maxX, m.position.x);
      minZ = Math.min(minZ, m.position.z);
      maxZ = Math.max(maxZ, m.position.z);
    });
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    meshes.forEach(m => {
      m.position.x -= centerX;
      m.position.z -= centerZ;
    });

    const merged = Mesh.MergeMeshes(meshes, true, true, undefined, false, false);
    if (!merged) {
      meshes.forEach(m => m.dispose());
      return;
    }
    merged.name     = "wall_group";
    merged.material = this.buildMaterial();
    this._mesh      = merged;
  }

  // ─────────────────────────────────────────────
  //  GEOMETRÍA
  // ─────────────────────────────────────────────

  private placeFigure(
    matrix:  number[][],
    cursorX: number,
    s:       number,
    h:       number,
    meshes:  Mesh[]
  ): number {
    for (let row = 0; row < matrix.length; row++)
      for (let col = 0; col < matrix[row].length; col++)
        if (matrix[row][col] === 1)
          meshes.push(this.makeBlock(cursorX + col, row, s, h));
    return cursorX + matrix[0].length;
  }

  private makeBlock(gridX: number, gridZ: number, s: number, h: number): Mesh {
    const box = MeshBuilder.CreateBox("b", {
      width:  s,
      height: h,
      depth:  s,
    }, this.scene);
    box.position = new Vector3(gridX * s, h / 2, gridZ * s);
    return box;
  }

  // ─────────────────────────────────────────────
  //  MATERIAL
  // ─────────────────────────────────────────────

  private buildMaterial(): StandardMaterial {
    const cfg = unitBlockConfig.material.normal;
    const mat = new StandardMaterial("wall_mat", this.scene);
    mat.diffuseColor  = new Color3(cfg.diffuse.r,  cfg.diffuse.g,  cfg.diffuse.b);
    mat.emissiveColor = new Color3(cfg.emissive.r, cfg.emissive.g, cfg.emissive.b);
    mat.specularColor = new Color3(cfg.specular.r, cfg.specular.g, cfg.specular.b);
    mat.alpha         = cfg.alpha;
    return mat;
  }

  // ─────────────────────────────────────────────
  //  BOUNDING BOX
  // ─────────────────────────────────────────────

  localSize(): Vector3 {
    if (!this._mesh) return Vector3.Zero();
    this._mesh.computeWorldMatrix(true);
    const bi = this._mesh.getBoundingInfo();
    return bi.boundingBox.maximumWorld.subtract(bi.boundingBox.minimumWorld);
  }

  sizeAfterRotation(rotSteps: number): Vector3 {
    const local = this.localSize();
    if (rotSteps % 2 === 0) return local;
    return new Vector3(local.z, local.y, local.x);
  }

  // ─────────────────────────────────────────────
  //  TRANSFORM FINAL
  // ─────────────────────────────────────────────

  applyTransform(position: Vector3, rotSteps: number): void {
    if (!this._mesh) return;
    this._mesh.position   = position.clone();
    this._mesh.rotation.y = rotSteps * (Math.PI / 2);
  }

  // ─────────────────────────────────────────────
  //  ROTACIÓN DE MATRIZ
  // ─────────────────────────────────────────────

  private rotateMatrix(matrix: ReadonlyArray<ReadonlyArray<number>>, steps: number): number[][] {
    let m: number[][] = matrix.map(row => [...row]);
    for (let i = 0; i < steps; i++) m = this.rotate90(m);
    return m;
  }

  private rotate90(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const out: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        out[c][rows - 1 - r] = matrix[r][c];
    return out;
  }

  // ─────────────────────────────────────────────
  //  ALEATORIOS
  // ─────────────────────────────────────────────

  private randomTetrisShape(): ShapeName {
    const tetris: ShapeName[] = ["L", "T", "Z", "elbow", "cross"];
    return tetris[Math.floor(Math.random() * tetris.length)];
  }

  private randomRotStep(): number {
    return Math.floor(Math.random() * 4);
  }

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────

  get mesh(): Mesh | null { return this._mesh; }

  dispose(): void {
    this._mesh?.dispose();
    this._mesh = null;
  }
}