import { type KeyboardInfo, type Scene, Vector3 } from "@babylonjs/core";
import { playerConfig } from "@/config/GameConfig";
import { type FixedCanionEnemy } from "./fixedCannion/FixedCanionEnemy";
import { SurveillanceStation } from "./surveillanceStation/SurveillanceStation";
import { PlayGroundState } from "@/playground/state/PlayGroundState";
import { classifyAreas } from "@/utils/ClassifyAreas";
import { getRectangleEnemyPosition } from "@/utils/getRectangleEnemyPosition";
import { CorridorSurveillanceStation } from "./corridorSurveillanceStation/CorridorSurveillanceStation";
import { SentinelMain } from "./sentinelV1/SentinelMain";

export class EnemiesSpawner {

  private survillanceStations: SurveillanceStation[] = [];
  private corridorSurveillanceStations: CorridorSurveillanceStation[] = [];
  private fixedCanions: FixedCanionEnemy[] = [];
  private sentinels: SentinelMain[] = [];  // ← nuevo


  constructor(
    private scene: Scene
  ) {
    scene.onKeyboardObservable.add((kbInfo: KeyboardInfo) => this.keyboardSpawn(kbInfo))

  }

    spawnAll(): void {

    const areas = PlayGroundState.getInstance().getAreas();
    const { squares, rectangles, corridors } = classifyAreas(areas);

      squares.forEach((square) => {
        this.survillanceStations.push(new SurveillanceStation(this.scene, square.center, playerConfig.player1.positionTrackeableMeshName, playerConfig.player1.player1RaycastDetectableName, "middle"))
      })

      rectangles.forEach((rectangle) => {

        const sentinel = new SentinelMain(
          this.scene,
          rectangle.center,
          playerConfig.player1.positionTrackeableMeshName,
          playerConfig.player1.player1RaycastDetectableName,
        );
        sentinel.start();
        this.sentinels.push(sentinel);

        const {position} = getRectangleEnemyPosition(rectangle)
        this.survillanceStations.push(new SurveillanceStation(this.scene, position, playerConfig.player1.positionTrackeableMeshName, playerConfig.player1.player1RaycastDetectableName, "highest"))
      })
      
      corridors.forEach((corridor)=>{
        this.corridorSurveillanceStations.push(new CorridorSurveillanceStation(this.scene,playerConfig.player1.positionTrackeableMeshName, playerConfig.player1.player1RaycastDetectableName,corridor))
      })
      
    }


  spawnOne(): void {
    const sentinel = new SentinelMain(
      this.scene,
      Vector3.Zero(),
      playerConfig.player1.positionTrackeableMeshName,
      playerConfig.player1.player1RaycastDetectableName,
    );
    sentinel.start();
    this.sentinels.push(sentinel);
  }

  dispose(): void {
    this.survillanceStations.forEach(e => e.dispose());  // ← llama dispose en cada enemigo
    this.survillanceStations = [];
    this.corridorSurveillanceStations.forEach(e => e.dispose());  // ← llama dispose en cada enemigo
    this.corridorSurveillanceStations = [];
    this.sentinels.forEach(e => e.dispose());              // ← nuevo
    this.sentinels = [];
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