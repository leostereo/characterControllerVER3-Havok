import { type Scene, Vector3 } from "@babylonjs/core";
import { playgroundConfig } from "@/config/GameConfig";
import { FixedCanionEnemy } from "./fixedCannion/FixedCanionEnemy";

export class EnemiesSpawner {

  private enemies: FixedCanionEnemy[] = [];

  constructor(
    private scene: Scene,
    private meshToShootName: string,
  ) { }

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  spawnAll(): void {
    const { groundSize, enemyCount, spawnSafeRadius, playerSpawn } = playgroundConfig;
    const halfSize = groundSize / 2;

    let placed = 0;
    let attempts = 0;
    const maxAttempts = enemyCount * 10;

    while (placed < enemyCount && attempts < maxAttempts) {
      attempts++;

      const position = this.randomPosition(halfSize);

      // Respetar zona libre alrededor del spawn del jugador
      const distToSpawn = Vector3.Distance(
        position,
        new Vector3(playerSpawn.x, 0, playerSpawn.z)
      );
      if (distToSpawn < spawnSafeRadius) continue;

      this.enemies.push(
        new FixedCanionEnemy(this.scene, position, this.meshToShootName)
      );
      placed++;
    }
  }

  dispose(): void {
    this.enemies = [];
  }

  // ─────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────
  private randomPosition(halfSize: number): Vector3 {
    const margin = 3;
    const x = (Math.random() * (halfSize - margin) * 2) - (halfSize - margin);
    const z = (Math.random() * (halfSize - margin) * 2) - (halfSize - margin);
    return new Vector3(x, 0, z);
  }
}