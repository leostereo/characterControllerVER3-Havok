// src/enemies/sentinelV1/VisionCone.ts

import {
  type Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type { IBaseVisionCone } from "../interfaces";
import type { SentinelState } from "./SentinelFSM";
import { sentinelConfig } from "@/config/GameConfig";

// ─────────────────────────────────────────────
//  CONFIG — vendrá de gameConfig.sentinel
// ─────────────────────────────────────────────
const TILT = 0.4;

const COLORS = {
  patrolling: {
    lamp: new Color3(0, 0.8, 1),
    projDiffuse: new Color3(0, 0.6, 0.9),
    projEmissive: new Color3(0, 0.4, 0.8),
    projAlpha: 0.25,
  },
  shooting: {
    lamp: new Color3(1, 0.2, 0.8),
    projDiffuse: new Color3(0.9, 0.1, 0.7),
    projEmissive: new Color3(0.8, 0, 0.6),
    projAlpha: 0.4,
  },
  searching: {
    lamp: new Color3(1, 0.6, 0),
    projDiffuse: new Color3(0.9, 0.5, 0),
    projEmissive: new Color3(0.8, 0.4, 0),
    projAlpha: 0.3,
  },
  intensiveSearch: {
    lamp: new Color3(1, 0.1, 0.1),
    projDiffuse: new Color3(0.9, 0, 0),
    projEmissive: new Color3(0.8, 0, 0),
    projAlpha: 0.45,
  },
} as const;

export class VisionCone implements IBaseVisionCone<SentinelState> {

  private lamp!: Mesh;
  private projection!: Mesh;
  private orbitPivot!: TransformNode;

  constructor(
    private scene: Scene,
    private rotationPivot: TransformNode,
    private barrel: Mesh,
    private barrelHeight: number = 3,
  ) { }

  // ─────────────────────────────────────────────
  //  CONTRATO
  // ─────────────────────────────────────────────
  buildVisuals(): void {
    const distToGround = this.barrelHeight / Math.tan(sentinelConfig.detection.tilt);
    const barrelWorldPos = this.barrel.getAbsolutePosition();

    // ── Lamp ──────────────────────────────────
    this.lamp = MeshBuilder.CreateCylinder(
      `sentinel_lamp_${this.rotationPivot.name}`,
      {
        diameterTop: 0,
        diameterBottom: 0.4,
        height: 0.8,
        tessellation: 8,
        cap: Mesh.NO_CAP,
      },
      this.scene
    );
    this.lamp.rotation.x = -(Math.PI / 2) + TILT;
    this.lamp.position = new Vector3(0, 0, sentinelConfig.detection.lampMuzzleOffset);
    this.lamp.parent = this.rotationPivot;
    this.lamp.isPickable = false;

    const lampMat = new StandardMaterial(
      `sentinel_lamp_mat_${this.rotationPivot.name}`,
      this.scene
    );
    lampMat.emissiveColor = COLORS.patrolling.lamp;
    lampMat.disableLighting = true;
    this.lamp.material = lampMat;

    // ── OrbitPivot ────────────────────────────
    this.orbitPivot = new TransformNode(
      `sentinel_orbit_pivot_${this.rotationPivot.name}`,
      this.scene
    );

    this.orbitPivot.position = new Vector3(
      barrelWorldPos.x,
      0,
      barrelWorldPos.z
    );

    // ── Projection disc ───────────────────────
    this.projection = MeshBuilder.CreateDisc(
      `sentinel_projection_${this.rotationPivot.name}`,
      { radius: 1, tessellation: 16, sideOrientation: Mesh.DOUBLESIDE },
      this.scene
    );
    this.projection.rotation.x = Math.PI / 2;
    this.projection.scaling = new Vector3(
      sentinelConfig.detection.projectionScale,
      sentinelConfig.detection.projectionScale,
      1
    );
    this.projection.position = new Vector3(
      0,
      0.01,
      distToGround * sentinelConfig.detection.projectionOffset
    );
    this.projection.parent = this.orbitPivot;
    this.projection.isPickable = false;

    const projMat = new StandardMaterial(
      `sentinel_proj_mat_${this.rotationPivot.name}`,
      this.scene
    );
    projMat.diffuseColor = COLORS.patrolling.projDiffuse;
    projMat.emissiveColor = COLORS.patrolling.projEmissive;
    projMat.alpha = COLORS.patrolling.projAlpha;
    projMat.backFaceCulling = false;
    projMat.disableLighting = true;
    this.projection.material = projMat;
  }

update(state: SentinelState): void {
  const barrelWorldPos = this.barrel.getAbsolutePosition();
  const forward        = this.rotationPivot.forward.normalize();
  const worldAngle     = Math.atan2(forward.x, forward.z);   // ← consistente con hasLineOfSight

  this.orbitPivot.position.x = barrelWorldPos.x;
  this.orbitPivot.position.z = barrelWorldPos.z;
  this.orbitPivot.rotation.y = worldAngle;

  // colores — igual que antes
  const colors  = sentinelConfig.colors.cone[state];
  const lampMat = this.lamp.material       as StandardMaterial;
  const projMat = this.projection.material as StandardMaterial;

  lampMat.emissiveColor = new Color3(colors.lamp.r,         colors.lamp.g,         colors.lamp.b);
  projMat.diffuseColor  = new Color3(colors.projDiffuse.r,  colors.projDiffuse.g,  colors.projDiffuse.b);
  projMat.emissiveColor = new Color3(colors.projEmissive.r, colors.projEmissive.g, colors.projEmissive.b);
  projMat.alpha         = colors.projAlpha;
}

  dispose(): void {
    this.lamp.dispose();
    this.projection.dispose();
    this.orbitPivot.dispose();
  }
}