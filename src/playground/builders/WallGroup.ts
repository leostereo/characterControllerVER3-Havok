import {
  type Scene,
  Mesh,
  MeshBuilder,
  Vector3,
} from "@babylonjs/core";
import {
  wallShapes,
  unitBlockConfig,
  type ShapeName,
} from "@/config/GameConfig";

/**
 * WallGroup — FASE 1
 * ──────────────────
 * Construye la figura plana en Y=0 (una sola capa de bloques).
 * Sin altura, sin física — solo geometría visual para validar
 * el algoritmo de construcción y placement.
 *
 * Estructura: [tetrisA] + [tramo I] + [tetrisB]
 * Todo en espacio local, origen (0,0,0), rotación 0.
 * Se aplica transform final con applyTransform().
 */
export class WallGroup {

  private _mesh: Mesh | null = null;

  readonly shapeA: ShapeName;
  readonly shapeB: ShapeName;
  readonly rotA:   number;   // steps 0-3
  readonly rotB:   number;

  constructor(private scene: Scene) {
    this.shapeA = this.randomTetrisShape();
    this.shapeB = this.randomTetrisShape();
    this.rotA   = this.randomRotStep();
    this.rotB   = this.randomRotStep();
  }

  // ─────────────────────────────────────────────
  //  CONSTRUCCIÓN — figura plana, sin altura
  // ─────────────────────────────────────────────

  /**
   * Construye el grupo con el largo de tramo dado.
   * Descarta el mesh previo si existía.
   * @param tramLength  bloques del tramo I (mínimo 1)
   */
  build(tramLength: number): void {
    this._mesh?.dispose();
    this._mesh = null;

    const s      = unitBlockConfig.size;
    const meshes: Mesh[] = [];
    let cursorX  = 0;

    // ── Figura A ──
    const matA = this.rotateMatrix(wallShapes[this.shapeA], this.rotA);
    cursorX    = this.placeFigure(matA, cursorX, s, meshes);

    // ── Tramo I (columna vertical de bloques en Z=0) ──
    for (let i = 0; i < tramLength; i++) {
      meshes.push(this.makeBlock(cursorX, 0, s));
      cursorX++;
    }

    // ── Figura B ──
    const matB = this.rotateMatrix(wallShapes[this.shapeB], this.rotB);
    this.placeFigure(matB, cursorX, s, meshes);

    // ── Centrar todos los bloques en el origen antes del merge ──
    // El mesh se construye desde (0,0) hacia +X/+Z, entonces su centro
    // real no coincide con el origen. Lo corregimos aquí para que
    // applyTransform() siempre posicione el centro real del grupo.
    let minX = Infinity,  maxX = -Infinity;
    let minZ = Infinity,  maxZ = -Infinity;
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

    // Merge en un único mesh
    const merged = Mesh.MergeMeshes(meshes, true, true, undefined, false, false);
    if (!merged) {
      meshes.forEach(m => m.dispose());
      return;
    }
    merged.name = "wall_group";
    this._mesh  = merged;
  }

  // ─────────────────────────────────────────────
  //  BOUNDING BOX
  // ─────────────────────────────────────────────

  /**
   * Tamaño AABB en espacio local (antes de rotar).
   */
  localSize(): Vector3 {
    if (!this._mesh) return Vector3.Zero();
    this._mesh.computeWorldMatrix(true);
    const bi = this._mesh.getBoundingInfo();
    return bi.boundingBox.maximumWorld.subtract(bi.boundingBox.minimumWorld);
  }

  /**
   * Tamaño AABB después de aplicar rotación Y.
   * 0°/180° → X=ancho, Z=prof
   * 90°/270° → X=prof, Z=ancho
   */
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
  //  HELPERS
  // ─────────────────────────────────────────────

  private placeFigure(
    matrix:  number[][],
    cursorX: number,
    s:       number,
    meshes:  Mesh[]
  ): number {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 0) continue;
        meshes.push(this.makeBlock(cursorX + col, row, s));
      }
    }
    return cursorX + matrix[0].length;
  }

  /**
   * Crea un bloque plano (altura = size * 0.3) apoyado en Y=0.
   * Solo visual — sin física.
   */
  private makeBlock(gridX: number, gridZ: number, s: number): Mesh {
    const box = MeshBuilder.CreateBox("b", {
      width:  s * 0.95,
      height: s * 0.3,    // plano en el suelo
      depth:  s * 0.95,
    }, this.scene);
    box.position = new Vector3(gridX * s, s * 0.15, gridZ * s);
    return box;
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
    // Excluimos "I" y "square" como figuras tetris de remate
    // I se usa solo para el tramo, square es demasiado compacto
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