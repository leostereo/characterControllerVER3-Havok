import { Color3, HighlightLayer, KeyboardEventTypes, type KeyboardInfo, type Mesh, type Scene, Vector3 } from "@babylonjs/core";
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
  private superVisionActive = false;
  private h1: HighlightLayer;

  constructor(
    private scene: Scene
  ) {

    scene.onKeyboardObservable.add((kbInfo: KeyboardInfo) => {
      if (kbInfo.event.key === 'q') {
        if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
          this.setSuperVision(true);
        } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
          this.setSuperVision(false);
        }
      }
    });

    this.h1 = new HighlightLayer("super_vision_hl", this.scene);
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

      const { position } = getRectangleEnemyPosition(rectangle)
      this.survillanceStations.push(new SurveillanceStation(this.scene, position, playerConfig.player1.positionTrackeableMeshName, playerConfig.player1.player1RaycastDetectableName, "highest"))
    })

    corridors.forEach((corridor) => {
      this.corridorSurveillanceStations.push(new CorridorSurveillanceStation(this.scene, playerConfig.player1.positionTrackeableMeshName, playerConfig.player1.player1RaycastDetectableName, corridor))
    })

    this.scene.meshes
      .filter(m =>
        m.name.startsWith("surveillance_projection_") ||
        m.name.startsWith("sentinel_triangle_") ||
        m.name.startsWith("sentinel_projection_")
      )
      .forEach(m => m.setEnabled(false));


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

  private setSuperVision(active: boolean): void {
    this.scene.meshes
      .filter(m =>
        m.name.startsWith("surveillance_projection_") ||
        m.name.startsWith("sentinel_triangle_")
      )
      .forEach(m => {
        m.setEnabled(active);
        if (active) {
          this.h1.addMesh(m as Mesh, new Color3(0, 1, 0.92));
        } else {
          this.h1.removeMesh(m as Mesh);
        }
      });
  }

  dispose(): void {
    this.survillanceStations.forEach(e => e.dispose());  // ← llama dispose en cada enemigo
    this.survillanceStations = [];
    this.corridorSurveillanceStations.forEach(e => e.dispose());  // ← llama dispose en cada enemigo
    this.corridorSurveillanceStations = [];
    this.sentinels.forEach(e => e.dispose());              // ← nuevo
    this.sentinels = [];
    this.setSuperVision(false);
    this.h1.dispose();
  }

}