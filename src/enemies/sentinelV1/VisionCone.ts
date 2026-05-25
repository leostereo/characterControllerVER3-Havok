// src/enemies/sentinelV1/VisionCone.ts

import {
  type Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  TransformNode,
  Vector3,
  VertexData,
} from "@babylonjs/core";
import type { IBaseVisionCone } from "../interfaces";
import type { SentinelState }   from "./SentinelFSM";
import { sentinelConfig, groundConfig } from "@/config/GameConfig";

export class VisionCone implements IBaseVisionCone<SentinelState> {

  private lamp!:       Mesh;
  private triangle!:   Mesh;
  private orbitPivot!: TransformNode;

  constructor(
    private scene:         Scene,
    private rotationPivot: TransformNode,
    private barrel:        Mesh,
    private barrelHeight:  number = 3,
  ) {}

  // ─────────────────────────────────────────────
  //  CONTRATO
  // ─────────────────────────────────────────────
  buildVisuals(): void {

    // ── OrbitPivot ────────────────────────────
    const barrelWorldPos   = this.barrel.getAbsolutePosition();
    this.orbitPivot        = new TransformNode(
      `sentinel_orbit_pivot_${this.rotationPivot.name}`,
      this.scene
    );
    this.orbitPivot.position = new Vector3(barrelWorldPos.x, 0, barrelWorldPos.z);

    // ── Lamp ──────────────────────────────────
    this.lamp = MeshBuilder.CreateCylinder(
      `sentinel_lamp_${this.rotationPivot.name}`,
      {
        diameterTop:    0,
        diameterBottom: 0.4,
        height:         0.8,
        tessellation:   8,
        cap:            Mesh.NO_CAP,
      },
      this.scene
    );
    this.lamp.rotation.x = -(Math.PI / 2) + sentinelConfig.detection.tilt;
    this.lamp.position   = new Vector3(0, 0, sentinelConfig.detection.lampMuzzleOffset);
    this.lamp.parent     = this.rotationPivot;
    this.lamp.isPickable = false;

    const lampMat           = new StandardMaterial(
      `sentinel_lamp_mat_${this.rotationPivot.name}`, this.scene
    );
    const initColors        = sentinelConfig.colors.cone.patrolling;
    lampMat.emissiveColor   = new Color3(
      initColors.lamp.r, initColors.lamp.g, initColors.lamp.b
    );
    lampMat.disableLighting = true;
    this.lamp.material      = lampMat;

    // ── Triángulo ─────────────────────────────
    this.triangle            = new Mesh(
      `sentinel_triangle_${this.rotationPivot.name}`, this.scene
    );
    this.triangle.parent     = this.orbitPivot;
    this.triangle.isPickable = false;

    this.updateTriangleGeometry();



    const projMat           = new StandardMaterial(
      `sentinel_proj_mat_${this.rotationPivot.name}`, this.scene
    );
    projMat.diffuseColor    = new Color3(
      initColors.projDiffuse.r, initColors.projDiffuse.g, initColors.projDiffuse.b
    );
    projMat.emissiveColor   = new Color3(
      initColors.projEmissive.r, initColors.projEmissive.g, initColors.projEmissive.b
    );
    projMat.alpha           = 0.06;
    projMat.backFaceCulling = false;
    projMat.disableLighting = true;
    projMat.wireframe       = true;
    this.triangle.material  = projMat;
    this.triangle.setEnabled(false);     // ← oculto por defecto

  }

  update(state: SentinelState): void {
    const barrelWorldPos = this.barrel.getAbsolutePosition();
    const forward        = this.rotationPivot.forward.normalize();
    const worldAngle     = Math.atan2(forward.x, forward.z);

    // sincronizar orbitPivot
    this.orbitPivot.position.x = barrelWorldPos.x;
    this.orbitPivot.position.z = barrelWorldPos.z;
    this.orbitPivot.rotation.y = worldAngle;

    // actualizar triángulo con el nuevo rango
    this.updateTriangleGeometry();

    // colores
    const colors  = sentinelConfig.colors.cone[state];
    const lampMat = this.lamp.material     as StandardMaterial;
    // const projMat = this.triangle.material as StandardMaterial;

    lampMat.emissiveColor = new Color3(
      colors.lamp.r,         colors.lamp.g,         colors.lamp.b
    );
    // projMat.diffuseColor  = new Color3(
    //   colors.projDiffuse.r,  colors.projDiffuse.g,  colors.projDiffuse.b
    // );
    // projMat.emissiveColor = new Color3(
    //   colors.projEmissive.r, colors.projEmissive.g, colors.projEmissive.b
    // );
    // projMat.alpha         = colors.projAlpha;
  }

  isPlayerInCone(playerMeshName: string): boolean {
    const target = this.scene.getMeshByName(playerMeshName);
    if (!target) return false;

    const forward    = this.rotationPivot.forward.normalize();
    const worldAngle = Math.atan2(forward.x, forward.z);
    const origin     = this.barrel.getAbsolutePosition();
    const range      = this.calcConeRange(origin, forward);

    // transformar posición del jugador a espacio local del cono
    const dx     = target.position.x - origin.x;
    const dz     = target.position.z - origin.z;
    const localX = dx * Math.cos(-worldAngle) + dz * Math.sin(-worldAngle);
    const localZ = -dx * Math.sin(-worldAngle) + dz * Math.cos(-worldAngle);

    // debe estar adelante y dentro del rango
    if (localZ < 0 || localZ > range) return false;

    // chequeo dentro del triángulo — ancho en Z proporcional al ángulo
    const halfWidth = Math.tan(sentinelConfig.sweep.angle) * localZ;
    return Math.abs(localX) <= halfWidth;
  }

  dispose(): void {
    this.lamp.dispose();
    this.triangle.dispose();
    this.orbitPivot.dispose();
  }

  // ─────────────────────────────────────────────
  //  TRIÁNGULO
  // ─────────────────────────────────────────────
  private updateTriangleGeometry(): void {
    const forward = this.rotationPivot.forward.normalize();
    const origin  = this.barrel.getAbsolutePosition();
    const range   = this.calcConeRange(origin, forward);
    const angle   = sentinelConfig.sweep.angle;
    const Y       = 0.02;  // ligeramente sobre el suelo

    // vértices en local space del orbitPivot
    const halfBase = Math.tan(angle) * range;

    const positions = [
      0,         Y, 0,          // v0 — vértice (origen)
      -halfBase, Y, range,      // v1 — esquina izquierda
       halfBase, Y, range,      // v2 — esquina derecha
    ];

    const indices = [0, 1, 2, 0, 2, 1];  // doble cara

    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);

    const vd       = new VertexData();
    vd.positions   = positions;
    vd.indices     = indices;
    vd.normals     = normals;
    vd.applyToMesh(this.triangle, true);
  }

  // ─────────────────────────────────────────────
  //  RANGO — distancia al borde del ground
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