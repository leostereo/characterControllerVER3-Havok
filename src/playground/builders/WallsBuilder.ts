import { type Scene, Vector3 } from "@babylonjs/core";
import { playgroundConfig }    from "@/config/GameConfig";
import { BasicCoverWall } from "../objetcs/coverWall/basicCoverWall";

export class WallsBuilder {

  private walls: BasicCoverWall[] = [];

  constructor(private scene: Scene) {}

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  build(): void {
    const { groundSize, wallCount, spawnSafeRadius, playerSpawn } = playgroundConfig;
    const halfSize = groundSize / 2;

    let placed = 0;
    let attempts = 0;
    const maxAttempts = wallCount * 10; // evitar loop infinito

    while (placed < wallCount && attempts < maxAttempts) {
      attempts++;

      const position = this.randomPosition(halfSize);

      // Respetar zona libre alrededor del spawn del jugador
      const distToSpawn = Vector3.Distance(
        position,
        new Vector3(playerSpawn.x, 0, playerSpawn.z)
      );
      if (distToSpawn < spawnSafeRadius) continue;

      // Rotación aleatoria en 4 orientaciones posibles (0, 90, 180, 270)
      const rotationY = (Math.floor(Math.random() * 4) * Math.PI) / 2;

      this.walls.push(new BasicCoverWall(this.scene, position, {}, rotationY));
      placed++;
    }
  }

  dispose(): void {
    this.walls.forEach(w => w.dispose());
    this.walls = [];
  }

  // ─────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────
  private randomPosition(halfSize: number): Vector3 {
    const margin = 2; // separación del borde del ground
    const x = (Math.random() * (halfSize - margin) * 2) - (halfSize - margin);
    const z = (Math.random() * (halfSize - margin) * 2) - (halfSize - margin);
    return new Vector3(x, 0, z);
  }
}