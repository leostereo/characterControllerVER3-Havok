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

// ─────────────────────────────────────────────
//  CONFIG — vendrá de gameConfig.sentinel
// ─────────────────────────────────────────────
const TILT             = 0.4;
const PROJECTION_SCALE = 3;
const PROJECTION_OFFSET = 1;
const LAMP_MUZZLE_OFFSET = 0.5;

const COLORS = {
  patrolling: {
    lamp:         new Color3(0,    0.8,  1),
    projDiffuse:  new Color3(0,    0.6,  0.9),
    projEmissive: new Color3(0,    0.4,  0.8),
    projAlpha:    0.25,
  },
  shooting: {
    lamp:         new Color3(1,    0.2,  0.8),
    projDiffuse:  new Color3(0.9,  0.1,  0.7),
    projEmissive: new Color3(0.8,  0,    0.6),
    projAlpha:    0.4,
  },
  searching: {
    lamp:         new Color3(1,    0.6,  0),
    projDiffuse:  new Color3(0.9,  0.5,  0),
    projEmissive: new Color3(0.8,  0.4,  0),
    projAlpha:    0.3,
  },
  intensiveSearch: {
    lamp:         new Color3(1,    0.1,  0.1),
    projDiffuse:  new Color3(0.9,  0,    0),
    projEmissive: new Color3(0.8,  0,    0),
    projAlpha:    0.45,
  },
} as const;

export class VisionCone implements IBaseVisionCone<SentinelState> {

  private lamp!:        Mesh;
  private projection!:  Mesh;
  private orbitPivot!:  TransformNode;

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
    const distToGround = this.barrelHeight / Math.tan(TILT);
    const barrelWorldPos = this.barrel.getAbsolutePosition();

    // ── Lamp ──────────────────────────────────
    this.lamp = MeshBuilder.CreateCylinder(
      `sentinel_lamp_${this.rotationPivot.name}`,
      {
        diameterTop:  0,
        diameterBottom: 0.4,
        height:       0.8,
        tessellation: 8,
        cap:          Mesh.NO_CAP,
      },
      this.scene
    );
    this.lamp.rotation.x = -(Math.PI / 2) + TILT;
    this.lamp.position   = new Vector3(0, 0, LAMP_MUZZLE_OFFSET);
    this.lamp.parent     = this.rotationPivot;
    this.lamp.isPickable = false;

    const lampMat = new StandardMaterial(
      `sentinel_lamp_mat_${this.rotationPivot.name}`,
      this.scene
    );
    lampMat.emissiveColor   = COLORS.patrolling.lamp;
    lampMat.disableLighting = true;
    this.lamp.material      = lampMat;

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
    this.projection.rotation.x  = Math.PI / 2;
    this.projection.scaling      = new Vector3(
      PROJECTION_SCALE,
      PROJECTION_SCALE,
      1
    );
    this.projection.position     = new Vector3(
      0,
      0.01,
      distToGround * PROJECTION_OFFSET
    );
    this.projection.parent       = this.orbitPivot;
    this.projection.isPickable   = false;

    const projMat = new StandardMaterial(
      `sentinel_proj_mat_${this.rotationPivot.name}`,
      this.scene
    );
    projMat.diffuseColor   = COLORS.patrolling.projDiffuse;
    projMat.emissiveColor  = COLORS.patrolling.projEmissive;
    projMat.alpha          = COLORS.patrolling.projAlpha;
    projMat.backFaceCulling = false;
    projMat.disableLighting = true;
    this.projection.material = projMat;
  }

update(state: SentinelState): void {
  // Sincronizar posición del orbitPivot con el rootNode
  const barrelWorldPos = this.barrel.getAbsolutePosition();
  this.orbitPivot.position.x = barrelWorldPos.x;
  this.orbitPivot.position.z = barrelWorldPos.z;

  // Sincronizar rotación
  this.orbitPivot.rotation.y = this.rotationPivot.rotation.y;

  // Colores — igual que antes
  const colors  = COLORS[state];
  const lampMat = this.lamp.material       as StandardMaterial;
  const projMat = this.projection.material as StandardMaterial;

  lampMat.emissiveColor = colors.lamp;
  projMat.diffuseColor  = colors.projDiffuse;
  projMat.emissiveColor = colors.projEmissive;
  projMat.alpha         = colors.projAlpha;
}

  dispose(): void {
    this.lamp.dispose();
    this.projection.dispose();
    this.orbitPivot.dispose();
  }
}