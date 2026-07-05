// src/debug/CyborgDebugMarkers.ts

import {
  type Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  type Vector3,
  type Mesh,
} from "@babylonjs/core";

export class CyborgDebugMarkers {

  private lastKnownMarker: Mesh;
  private searchDestMarker: Mesh;

  constructor(private scene: Scene) {
    this.lastKnownMarker  = this.createMarker("debug_last_known",  new Color3(0, 0.8, 1));    // cian
    this.searchDestMarker = this.createMarker("debug_search_dest", new Color3(1, 0.5, 0));    // naranja
  }

  // ─────────────────────────────────────────────
  //  UPDATE
  // ─────────────────────────────────────────────
  update(lastKnownPosition: Vector3 | null, searchDestination: Vector3 | null): void {
    if (lastKnownPosition) {
      this.lastKnownMarker.setEnabled(true);
      this.lastKnownMarker.position.x = lastKnownPosition.x;
      this.lastKnownMarker.position.z = lastKnownPosition.z;
    } else {
      this.lastKnownMarker.setEnabled(false);
    }

    if (searchDestination) {
      this.searchDestMarker.setEnabled(true);
      this.searchDestMarker.position.x = searchDestination.x;
      this.searchDestMarker.position.z = searchDestination.z;
    } else {
      this.searchDestMarker.setEnabled(false);
    }
  }

  dispose(): void {
    this.lastKnownMarker.dispose();
    this.searchDestMarker.dispose();
  }

  // ─────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────
  private createMarker(name: string, color: Color3): Mesh {
    const mesh = MeshBuilder.CreateCylinder(
      name,
      { diameter: 0.5, height: 0.1, tessellation: 16 },
      this.scene
    );
    mesh.position.y = 0.05;
    mesh.setEnabled(false);

    const mat         = new StandardMaterial(`${name}_mat`, this.scene);
    mat.diffuseColor  = color;
    mat.emissiveColor = color;
    mesh.material     = mat;
    return mesh;
  }
}