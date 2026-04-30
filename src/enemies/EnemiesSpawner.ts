import { type Scene, Vector3 } from "@babylonjs/core";
import { playerConfig, playgroundConfig } from "@/config/GameConfig";
// import { FixedCanionEnemy } from "./fixedCannion/FixedCanionEnemy";
import { SurveillanceStation } from "./surveillanceStation/SurveillanceStation";

export class EnemiesSpawner {

  private enemies: SurveillanceStation[] = [];
  private meshToShootName_surveillanceStation: string = playerConfig.player1.meshName;

  constructor(
    private scene: Scene
  ) {

  }

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

      if (attempts % 2 === 0) {
        this.enemies.push(
          new SurveillanceStation(this.scene, position, this.meshToShootName_surveillanceStation, "low"),
        );
      } else if (attempts % 3 === 0) {
        this.enemies.push(
          new SurveillanceStation(this.scene, position, this.meshToShootName_surveillanceStation, "middle")
        )
      } else {
        this.enemies.push(
          new SurveillanceStation(this.scene, position, this.meshToShootName_surveillanceStation, "highest")
        )
      }
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