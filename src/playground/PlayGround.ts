import {
  type Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PhysicsAggregate,
  PhysicsShapeType,
} from "@babylonjs/core";
import { WallsBuilder }     from "./builders/WallsBuilder";
import { playgroundConfig, meshNames } from "@/config/GameConfig";
import { EnemiesSpawner } from "@/enemies/EnemiesSpawner";

export class PlayGround {

  private wallsBuilder:   WallsBuilder;
  private enemiesSpawner: EnemiesSpawner;

  constructor(
    private scene:           Scene,
    private meshToShootName: string,
  ) {
    this.wallsBuilder   = new WallsBuilder(scene);
    this.enemiesSpawner = new EnemiesSpawner(scene);

    this.buildGround();
    this.wallsBuilder.build();
    this.enemiesSpawner.spawnAll();
  }

  // ─────────────────────────────────────────────
  //  GROUND
  // ─────────────────────────────────────────────
  private buildGround(): void {
    const { groundSize } = playgroundConfig;

    const ground = MeshBuilder.CreateGround(
      meshNames.ground,
      { width: groundSize, height: groundSize, subdivisions: 2 },
      this.scene
    );

    const mat         = new StandardMaterial("ground_mat", this.scene);
    mat.diffuseColor  = new Color3(0.06, 0.08, 0.10); // gris oscuro sci-fi
    mat.specularColor = new Color3(0.1,  0.1,  0.1);
    ground.material   = mat;

    // Física estática — los proyectiles rebotan en el suelo
    new PhysicsAggregate(
      ground,
      PhysicsShapeType.BOX,
      { mass: 0, restitution: 0.2, friction: 0.8 },
      this.scene
    );
  }

  // ─────────────────────────────────────────────
  //  CICLO DE VIDA
  // ─────────────────────────────────────────────
  dispose(): void {
    this.wallsBuilder.dispose();
    this.enemiesSpawner.dispose();
  }
}