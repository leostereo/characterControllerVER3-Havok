// src/enemies/cyborgV1/CyborgVisionCone.ts

import {
  type Scene,
  type AbstractMesh,
  Mesh,
  StandardMaterial,
  Color3,
  TransformNode,
  Vector3,
  VertexData,
} from "@babylonjs/core";
import { groundConfig, superVisionConfig, cyborgConfig } from "@/config/GameConfig";
// import type { CyborgState } from "./CyborgFSM";

export class CyborgVisionCone {

  private triangle!:   Mesh;
  private orbitPivot!: TransformNode;

  constructor(
    private scene:    Scene,
    private rootMesh: AbstractMesh,   // ← reemplaza rotationPivot + barrel
  ) {}

  // ─────────────────────────────────────────────
  //  BUILD
  // ─────────────────────────────────────────────
  buildVisuals(): void {
    const pos = this.rootMesh.getAbsolutePosition();

    this.orbitPivot          = new TransformNode(
      `cyborg_orbit_pivot_${this.rootMesh.name}`, this.scene
    );
    this.orbitPivot.position = new Vector3(pos.x, 0, pos.z);

    this.triangle            = new Mesh(
      `cyborg_triangle_${this.rootMesh.name}`, this.scene
    );
    this.triangle.parent     = this.orbitPivot;
    this.triangle.isPickable = false;
    this.triangle.setEnabled(false);

    this.updateTriangleGeometry();


    const material = this.scene.materials.find((mate)=>mate.name.startsWith('sentinel_proj_mat_'))
    if(material){
        this.triangle.material= material;
    }else{
        const { emissive, diffuse } = superVisionConfig.projection;
        const projMat               = new StandardMaterial(
          `cyborg_proj_mat_${this.rootMesh.name}`, this.scene
        );
        projMat.diffuseColor    = new Color3(diffuse.r,  diffuse.g,  diffuse.b);
        projMat.emissiveColor   = new Color3(emissive.r, emissive.g, emissive.b);
        projMat.backFaceCulling = false;
        projMat.disableLighting = true;
        projMat.wireframe       = true;
        this.triangle.material  = projMat;
    }
  }

  // ─────────────────────────────────────────────
  //  UPDATE
  // ─────────────────────────────────────────────
  update(): void {
    const pos        = this.rootMesh.getAbsolutePosition();
    const forward    = this.rootMesh.forward.normalize();
    const worldAngle = Math.atan2(forward.x, forward.z);

    this.orbitPivot.position.x = pos.x;
    this.orbitPivot.position.z = pos.z;
    this.orbitPivot.rotation.y = worldAngle;

    this.updateTriangleGeometry();
  }

  // ─────────────────────────────────────────────
  //  DETECCIÓN
  // ─────────────────────────────────────────────
  isPlayerInCone(playerMeshName: string): boolean {
    const target = this.scene.getMeshByName(playerMeshName);
    if (!target) return false;

    const forward    = this.rootMesh.forward.normalize();
    const worldAngle = Math.atan2(forward.x, forward.z);
    const origin     = this.rootMesh.getAbsolutePosition();
    const range      = this.calcConeRange(origin, forward);

    const dx     = target.position.x - origin.x;
    const dz     = target.position.z - origin.z;
    const localX = dx * Math.cos(-worldAngle) + dz * Math.sin(-worldAngle);
    const localZ = -dx * Math.sin(-worldAngle) + dz * Math.cos(-worldAngle);

    if (localZ < 0 || localZ > range) return false;

    const halfWidth = Math.tan(cyborgConfig.detection.coneAngle) * localZ;
    return Math.abs(localX) <= halfWidth;
  }

  dispose(): void {
    this.triangle.dispose();
    this.orbitPivot.dispose();
  }

  // ─────────────────────────────────────────────
  //  TRIÁNGULO
  // ─────────────────────────────────────────────
  private updateTriangleGeometry(): void {
    const forward = this.rootMesh.forward.normalize();
    const origin  = this.rootMesh.getAbsolutePosition();
    const range   = this.calcConeRange(origin, forward);
    const angle   = cyborgConfig.detection.coneAngle;
    const Y       = 0.02;

    const halfBase  = Math.tan(angle) * range;
    const positions = [
      0,         Y, 0,
      -halfBase, Y, range,
       halfBase, Y, range,
    ];
    const indices = [0, 1, 2, 0, 2, 1];
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);

    const vd     = new VertexData();
    vd.positions = positions;
    vd.indices   = indices;
    vd.normals   = normals;
    vd.applyToMesh(this.triangle, true);
  }

  // ─────────────────────────────────────────────
  //  RANGO
  // ─────────────────────────────────────────────
  private calcConeRange(origin: Vector3, forward: Vector3): number {
    const xMin = -groundConfig.width  / 2;
    const xMax =  groundConfig.width  / 2;
    const zMin = -groundConfig.height / 2;
    const zMax =  groundConfig.height / 2;

    const tValues: number[] = [];
    if (Math.abs(forward.x) > 0.0001) {
      tValues.push((xMax - origin.x) / forward.x);
      tValues.push((xMin - origin.x) / forward.x);
    }
    if (Math.abs(forward.z) > 0.0001) {
      tValues.push((zMax - origin.z) / forward.z);
      tValues.push((zMin - origin.z) / forward.z);
    }
    return Math.min(...tValues.filter(t => t > 0));
  }
}