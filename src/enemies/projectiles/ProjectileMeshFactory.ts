// src/enemies/projectiles/ProjectileMeshFactory.ts

import {
  type Scene,
  type Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Quaternion,
} from "@babylonjs/core";

export type ProjectileType = "sphere" | "laser";

export interface ProjectileMeshOptions {
  radius: number;
  height?: number;   // ← solo para laser
  color?: {
    diffuse: Color3;
    emissive: Color3;
  };
  direction?: Vector3;   // ← nuevo

}

export class ProjectileMeshFactory {

  static create(
    type: ProjectileType,
    scene: Scene,
    options: ProjectileMeshOptions
  ): Mesh {
    switch (type) {
      case "laser": return this.createLaser(scene, options);
      case "sphere": return this.createSphere(scene, options);
    }
  }

  // ─────────────────────────────────────────────
  //  SPHERE — sentinel / canion
  // ─────────────────────────────────────────────
  private static createSphere(scene: Scene, options: ProjectileMeshOptions): Mesh {
    const mesh = MeshBuilder.CreateSphere(
      "projectile",
      { diameter: options.radius * 2, segments: 6 },
      scene
    );
    const mat = new StandardMaterial("projectile_mat", scene);
    mat.diffuseColor = options.color?.diffuse ?? new Color3(1.0, 0.4, 0.0);
    mat.emissiveColor = options.color?.emissive ?? new Color3(1.0, 0.3, 0.0);
    mat.specularColor = new Color3(1, 1, 1);
    mesh.material = mat;
    return mesh;
  }

  // ─────────────────────────────────────────────
  //  LASER — cyborg
  // ─────────────────────────────────────────────
  private static createLaser(scene: Scene, options: ProjectileMeshOptions): Mesh {
    const mesh = MeshBuilder.CreateCylinder(
      "projectile",
      {
        diameter: options.radius * 2,
        height: options.height ?? 0.8,
        tessellation: 6,
      },
      scene
    );

    if (options.direction) {
      const forward = options.direction.normalize();
      mesh.rotationQuaternion = Quaternion.FromUnitVectorsToRef(
        new Vector3(0, 1, 0),   // ← up local del cilindro
        forward,
        new Quaternion()
      );
    }

    const mat = new StandardMaterial("projectile_mat", scene);
    mat.diffuseColor = options.color?.diffuse ?? new Color3(0.0, 0.8, 1.0);
    mat.emissiveColor = options.color?.emissive ?? new Color3(0.0, 1.0, 1.0);
    mat.disableLighting = true;
    mesh.material = mat;
    return mesh;
  }
}