import { type Scene, Vector3, KeyboardEventTypes, PhysicsAggregate, PhysicsShapeType, type Mesh } from "@babylonjs/core";
import {
  wallsBuilderConfig,
  groundConfig,
  playgroundConfig,
  meshMetadata,
} from "@/config/GameConfig";
import { WallGroup } from "./WallGroup";
import { computeBuildMap, areaAssignment, type BuildMap } from "./BuildMap";
import { PlayGroundState } from "../state/PlayGroundState";
import { SafetyPlaceWallGroup } from "./SafetyPlaceWallGroup";

export class WallsBuilder {

  private groups: WallGroup[] = [];
  private groupCounter = 0;
  private zoneMeshes: Mesh[] = [];

  constructor(private scene: Scene) {
    this.registerDebugKeys();
  }

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────

  build(): BuildMap {




    const cfg      = wallsBuilderConfig;
    const limitX   = groundConfig.width  / 2 - cfg.groundMargin;
    const limitZ   = groundConfig.height / 2 - cfg.groundMargin;
    const spawnPos = new Vector3(
      playgroundConfig.playerSpawn.x, 0,
      playgroundConfig.playerSpawn.z
    );

    const placedPositions: Vector3[] = [];
    this.groupCounter = 0;
    let placed   = 0;
    let attempts = 0;
    const maxAttempts = cfg.wallGroupCount * 20;


    
    // ── Safety place — primero ────────────────
    const safetyGroup = new SafetyPlaceWallGroup(this.scene);
    safetyGroup.build();

    const rotSteps = Math.floor(Math.random() * 4);
    const safetyResult = this.fitGroup(safetyGroup as unknown as WallGroup, limitX, limitZ);

    if (safetyResult) {
      safetyGroup.applyTransform(safetyResult.position, rotSteps);
      this.setupSafetyMesh(safetyGroup);
      this.addPhysicsToMesh(safetyGroup.mesh!);

      const spawnPoint = safetyGroup.getSpawnPoint();
      PlayGroundState.getInstance().updateSpawnPoint(spawnPoint);
    }


    while (placed < cfg.wallGroupCount && attempts < maxAttempts) {
      attempts++;

      const group  = new WallGroup(this.scene);
      const result = this.fitGroup(group, limitX, limitZ);

      if (!result) {
        group.dispose();
        continue;
      }

      const { position, rotSteps } = result;

      if (Vector3.Distance(position, spawnPos) < cfg.spawnSafeRadius) {
        group.dispose();
        continue;
      }

      const tooClose = placedPositions.some(
        p => Vector3.Distance(position, p) < cfg.minGroupSpacing
      );
      if (tooClose) {
        group.dispose();
        continue;
      }

      group.applyTransform(position, rotSteps);
      this.setupMesh(group);
      this.addPhysics(group);
      this.groups.push(group);
      placedPositions.push(position);
      placed++;
    }

    console.warn(`WallsBuilder: ${placed}/${cfg.wallGroupCount} grupos colocados en ${attempts} intentos`);
    const buildMap = computeBuildMap(this.groups);
    const areas = areaAssignment(buildMap);
    PlayGroundState.getInstance().updateOpenAreas(areas);
    PlayGroundState.getInstance().updateEmptyPoints(buildMap.emptyUnits)

    // this.zoneMeshes = [
    //   ...renderEmptyUnits(buildMap, this.scene),
    //   ...renderAreas(areas, this.scene),
    // ];

    return buildMap;
  }

  dispose(): void {
    this.zoneMeshes.forEach(m => m.dispose());
    this.zoneMeshes = [];
    this.groups.forEach(g => g.dispose());
    this.groups = [];
  }

  // ─────────────────────────────────────────────
  //  DEBUG — tecla T regenera los muros
  // ─────────────────────────────────────────────

  private registerDebugKeys(): void {
    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (
        kbInfo.type === KeyboardEventTypes.KEYDOWN &&
        kbInfo.event.key.toLowerCase() === "t"
      ) {
        console.warn("WallsBuilder: regenerando muros...");
        this.dispose();
        this.build();
      }
    });
  }

  // ─────────────────────────────────────────────
  //  FÍSICA
  // ─────────────────────────────────────────────

  private setupMesh(group: WallGroup): void {
    if (!group.mesh) return;
    group.mesh.name     = `wall_group_${this.groupCounter++}`;
    group.mesh.metadata = {
      type:      meshMetadata.types.wall,
      wallClass: meshMetadata.wallClasses.basic,
    };
  }

  // private addPhysics(group: WallGroup): void {
  //   if (!group.mesh) return;
  //   new PhysicsAggregate(
  //     group.mesh,
  //     PhysicsShapeType.MESH,
  //     { mass: 0, restitution: 0.4, friction: 0.6 },
  //     this.scene
  //   );
  // }


  private addPhysics(group: WallGroup): void {
  if (!group.mesh) return;
  this.addPhysicsToMesh(group.mesh);
}

  private setupSafetyMesh(group: SafetyPlaceWallGroup): void {
    if (!group.mesh) return;
    group.mesh.name = `safety_place_wall`;
    group.mesh.metadata = {
      type: meshMetadata.types.wall,
      wallClass: meshMetadata.wallClasses.basic,
    };
  }

  private addPhysicsToMesh(mesh: Mesh): void {
    new PhysicsAggregate(
      mesh,
      PhysicsShapeType.MESH,
      { mass: 0, restitution: 0.4, friction: 0.6 },
      this.scene
    );
  }

  // ─────────────────────────────────────────────
  //  FIT
  //  - largo del tramo: aleatorio entre min y max
  //  - rotaciones: orden aleatorio para no sesgar hacia rot=0
  //  - si no cabe: reduce el tramo en 1 y reintenta con nuevas rotaciones
  // ─────────────────────────────────────────────

  private fitGroup(
    group:  WallGroup,
    limitX: number,
    limitZ: number,
  ): { position: Vector3; rotSteps: number } | null {

    const cfg = wallsBuilderConfig;

    // Largo inicial aleatorio entre min y max
    let tram = this.randomInt(cfg.minTramLength, cfg.maxTramLength);

    while (tram >= cfg.minTramLength) {
      group.build(tram);

      // Rotaciones en orden aleatorio para no sesgar
      const rotations = this.shuffled([0, 1, 2, 3]);

      for (const rot of rotations) {
        const size  = group.sizeAfterRotation(rot);
        const halfW = size.x / 2;
        const halfD = size.z / 2;

        if (halfW > limitX || halfD > limitZ) continue;

        const x = (Math.random() * 2 - 1) * (limitX - halfW);
        const z = (Math.random() * 2 - 1) * (limitZ - halfD);

        return { position: new Vector3(x, 0, z), rotSteps: rot };
      }

      // Ninguna rotación funcionó — reducir tramo en 1
      tram--;
    }

    return null;
  }

  // ─────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────

  /** Fisher-Yates shuffle */
  private shuffled(arr: number[]): number[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}