// src/playground/builders/SafetyPlaceWallGroup.ts

import {
  type Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import { unitBlockConfig, wallsBuilderConfig } from "@/config/GameConfig";

const C_SHAPE = [
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 0],  // ← apertura
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
] as const;

export class SafetyPlaceWallGroup {

  private _mesh: Mesh | null = null;

  // centro del hueco en local space — col 2, row 2
  private readonly INNER_CENTER_LOCAL = new Vector3(2, 0, 2);

  // ─────────────────────────────────────────────
  //  CONSTRUCCIÓN
  // ─────────────────────────────────────────────
  build(): void {
    this._mesh?.dispose();
    this._mesh = null;

    const s   = unitBlockConfig.size;
    const cfg = wallsBuilderConfig.safetyPlace;
    const h   = cfg.heightMultiplier * s;

    const meshes: Mesh[] = [];

    for (let row = 0; row < C_SHAPE.length; row++) {
      for (let col = 0; col < C_SHAPE[row].length; col++) {
        if (C_SHAPE[row][col] === 1) {
          const box = MeshBuilder.CreateBox("safety_block", {
            width:  s,
            height: h,
            depth:  s,
          }, this.scene);
          box.position = new Vector3(col * s, h / 2, row * s);
          meshes.push(box);
        }
      }
    }

    // centrar
    const centerX = (C_SHAPE[0].length - 1) / 2 * s;
    const centerZ = (C_SHAPE.length    - 1) / 2 * s;
    meshes.forEach(m => {
      m.position.x -= centerX;
      m.position.z -= centerZ;
    });

    const merged = Mesh.MergeMeshes(meshes, true, true, undefined, false, false);
    if (!merged) {
      meshes.forEach(m => m.dispose());
      return;
    }

    merged.name     = "safety_place_wall";
    merged.material = this.buildMaterial();
    this._mesh      = merged;
  }

  // ─────────────────────────────────────────────
  //  TRANSFORM
  // ─────────────────────────────────────────────
  applyTransform(position: Vector3, rotSteps: number): void {
    if (!this._mesh) return;
    this._mesh.position   = position.clone();
    this._mesh.rotation.y = rotSteps * (Math.PI / 2);
  }

  // ─────────────────────────────────────────────
  //  SPAWN POINT — centro del hueco en world space
  // ─────────────────────────────────────────────
    getSpawnPoint(): Vector3 {
        if (!this._mesh) return Vector3.Zero();
        console.log("mesh position:", this._mesh.position);
        console.log("mesh rotation:", this._mesh.rotation.y);
        return new Vector3(
            this._mesh.position.x,
            0.9,
            this._mesh.position.z,
        );
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
  //  MATERIAL — verde Tron
  // ─────────────────────────────────────────────
  private buildMaterial(): StandardMaterial {
    const cfg = wallsBuilderConfig.safetyPlace.material;
    const mat = new StandardMaterial("safety_place_mat", this.scene);
    mat.diffuseColor  = new Color3(cfg.diffuse.r,  cfg.diffuse.g,  cfg.diffuse.b);
    mat.emissiveColor = new Color3(cfg.emissive.r, cfg.emissive.g, cfg.emissive.b);
    mat.specularColor = new Color3(cfg.specular.r, cfg.specular.g, cfg.specular.b);
    mat.alpha         = cfg.alpha;
    return mat;
  }

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  get mesh(): Mesh | null { return this._mesh; }

  constructor(private scene: Scene) {}

  dispose(): void {
    this._mesh?.dispose();
    this._mesh = null;
  }
}