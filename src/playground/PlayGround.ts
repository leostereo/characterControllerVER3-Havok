import {
  type Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PhysicsAggregate,
  PhysicsShapeType,
} from "@babylonjs/core";
import { WallsBuilder }     from "./builders/WallsBuilder";
import { meshNames, groundConfig } from "@/config/GameConfig";
import { EnemiesSpawner } from "@/enemies/EnemiesSpawner";
import { NavMeshService } from "./NavMeshService";

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

    void this.createNavMesh(scene);
  }

  private async createNavMesh(scene: Scene):Promise<void> {
    const navMeshService = NavMeshService.getInstance(scene);
    await navMeshService.build();
    // this.enemiesSpawner.spawnAll();
    this.enemiesSpawner.spawnOne();
  }

  // ─────────────────────────────────────────────
  //  GROUND
  // ─────────────────────────────────────────────
  private buildGround(): void {

    const ground = MeshBuilder.CreateGround(
      meshNames.ground,
      { width: groundConfig.width, height: groundConfig.height, subdivisions: 2 },
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