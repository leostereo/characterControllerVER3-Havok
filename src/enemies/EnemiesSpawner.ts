import { type KeyboardInfo, type Scene, Vector3 } from "@babylonjs/core";
import { playerConfig, playgroundConfig } from "@/config/GameConfig";
import { type FixedCanionEnemy } from "./fixedCannion/FixedCanionEnemy";
import { SurveillanceStation } from "./surveillanceStation/SurveillanceStation";

export class EnemiesSpawner {

  private survillanceStations: SurveillanceStation[] = [];
  private fixedCanions: FixedCanionEnemy[] = []

  constructor(
    private scene: Scene
  ) {
    scene.onKeyboardObservable.add((kbInfo: KeyboardInfo) => this.keyboardSpawn(kbInfo))

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
        this.survillanceStations.push(new SurveillanceStation(this.scene, position, playerConfig.player1.positionTrackeableMeshName, playerConfig.player1.player1RaycastDetectableName, "low"))
      } else if (attempts % 3 === 0) {
        this.survillanceStations.push(new SurveillanceStation(this.scene, position, playerConfig.player1.positionTrackeableMeshName, playerConfig.player1.player1RaycastDetectableName, "middle"))
      } else {
        this.survillanceStations.push(new SurveillanceStation(this.scene, position, playerConfig.player1.positionTrackeableMeshName, playerConfig.player1.player1RaycastDetectableName, "highest"))
        // //this.fixedCanions.push(new FixedCanionEnemy(this.scene, position, playerConfig.player1.positionTrackeableMeshName,playerConfig.player1.player1RaycastDetectableName))
      }
      placed++;
    }
  }

  spawnOne(): void {
    const { groundSize } = playgroundConfig;
    const halfSize = groundSize / 2;
    const position = this.randomPosition(halfSize);
    this.survillanceStations.push(new SurveillanceStation(this.scene, position, playerConfig.player1.positionTrackeableMeshName, playerConfig.player1.player1RaycastDetectableName, "low"))
    
  }

  dispose(): void {
    this.survillanceStations.forEach(e => e.dispose());  // ← llama dispose en cada enemigo
    this.survillanceStations = [];
  }

  private keyboardSpawn(kbInfo: KeyboardInfo): void {
    switch (kbInfo.event.key) {
      case 'r':
        this.dispose()
        this.spawnAll();
        break;
      case '2':
        break;
    }
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