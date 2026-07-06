import { playerConfig } from "@/config/GameConfig";
import { AssetsManager, type Scene, type AbstractMesh, type AnimationGroup, type Texture, type AbstractAssetTask } from "@babylonjs/core";

export interface LoadedAssets {
  meshes: { [key: string]: AbstractMesh[] };
  animations: { [key: string]: AnimationGroup[] };
  textures: { [key: string]: Texture };
  binaries: { [key: string]: ArrayBuffer };
}

export class AssetLoader {
  private assetsManager: AssetsManager;
  private loadedAssets: LoadedAssets = {
    meshes: {},
    animations: {},
    textures: {},
    binaries: {},
  };

  constructor(private scene: Scene) {
    this.assetsManager = new AssetsManager(this.scene);
  }

  /**
   * Agrega una tarea para cargar un mesh (ej: GLB/GLTF).
   */
  addMeshTask(
    name: string,
    meshNames: string | string[],
    rootUrl: string,
    filename: string,
    onSuccess?: (meshes: AbstractMesh[], animationGroups: AnimationGroup[]) => void,
    onError?: (message: string, exception?: Error) => void
  ): void {
    const task = this.assetsManager.addMeshTask(name, meshNames, rootUrl, filename);
    task.onSuccess = (task): void => {
      this.loadedAssets.meshes[name] = task.loadedMeshes as AbstractMesh[];
      this.loadedAssets.animations[name] = task.loadedAnimationGroups;
      if (onSuccess) onSuccess(task.loadedMeshes as AbstractMesh[], task.loadedAnimationGroups);
    };
    if (onError) {
      task.onError = (task, message, exception): void => onError(message ?? `'ERRORGEN' at ${task.name}`, exception);
    }
  }

  /**
   * Agrega una tarea para cargar una textura.
   */
  addTextureTask(
    name: string,
    url: string,
    onSuccess?: (texture: Texture) => void,
    onError?: (message: string, exception?: Error) => void
  ): void {
    const task = this.assetsManager.addTextureTask(name, url);
    task.onSuccess = (task): void => {
      this.loadedAssets.textures[name] = task.texture;
      if (onSuccess) onSuccess(task.texture);
    };
    if (onError) {
      task.onError = (task, message, exception): void => onError(message ?? `'ERRORGEN' at ${task.name}`, exception);
    }
  }

  /**
   * Agrega una tarea para cargar un archivo binario (ej: sonidos).
   */
  addBinaryFileTask(
    name: string,
    url: string,
    onSuccess?: (data: ArrayBuffer) => void,
    onError?: (message: string, exception?: Error) => void
  ): void {
    const task = this.assetsManager.addBinaryFileTask(name, url);
    task.onSuccess = (task): void => {
      this.loadedAssets.binaries[name] = task.data;
      if (onSuccess) onSuccess(task.data);
    };
    if (onError) {
      task.onError = (task, message, exception): void => onError(message ?? `'ERRORGEN' at ${task.name}`, exception);
    }
  }

  /**
   * Agrega una tarea para generar un mesh en código (ej: Ground).
   */
  addGeneratedMeshTask(
    name: string,
    generator: () => AbstractMesh,
    onSuccess?: (mesh: AbstractMesh) => void,
    onError?: (message: string) => void
  ): void {
    try {
      const mesh = generator();
      this.loadedAssets.meshes[name] = [mesh];
      if (onSuccess) onSuccess(mesh);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (onError) onError(message);
    }
  }

  addDefaultTasks(): void {
    this._addCharacterTask();
    // this._addCyborgTask();
    this._addParticleTextureTask();
    this._addSoundFXTasks();   // ← nuevo
  }

  /**
   * Inicia la carga de todos los assets.
   */
  load(
    onFinish?: (assets: LoadedAssets) => void,
    onProgress?: (remainingCount: number, totalCount: number, task: AbstractAssetTask) => void
  ): void {
    if (onFinish) {
      this.assetsManager.onFinish = (): void => onFinish(this.loadedAssets);
    }
    if (onProgress) {
      this.assetsManager.onProgress = onProgress;
    }
    this.assetsManager.load();
  }

  /**
   * Obtener assets cargados.
   */
  getAssets(): LoadedAssets {
    return this.loadedAssets;
  }

  /**
   * Resetea el AssetsManager.
   */
  reset(): void {
    this.assetsManager.reset();
    this.loadedAssets = { meshes: {}, animations: {}, textures: {}, binaries: {} };
  }

  private _addCharacterTask(): void {
    this.addMeshTask(
      "characterTask",
      "",
      "",
      "./model/ybotV11.glb",
      (meshes) => {
        const detectableName = playerConfig.player1.player1RaycastDetectableName;
        const alphaJoints = meshes.find(m => m.name === "Alpha_Joints");
        if (alphaJoints) alphaJoints.name = `${detectableName}_Alpha_Joints`;

        const alphaSurface = meshes.find(m => m.name === "Alpha_Surface");
        if (alphaSurface) alphaSurface.name = `${detectableName}_Alpha_Surface`;
      },
      (message, exception) => {
        console.error("[AssetLoader] Error cargando personaje:", message, exception);
      }
    );
  }

  private _addCyborgTask(): void {
    this.addMeshTask(
      "cyborgTask",
      "",
      "",
      "./model/cyborg.glb",
      (meshes) => {
        //
        console.warn(meshes)
      },
      (message, exception) => {
        console.error("[AssetLoader] Error cargando personaje:", message, exception);
      }
    );
  }

  private _addParticleTextureTask(): void {
    this.addTextureTask(
      "emiterTextureTask",
      "https://assets.babylonjs.com/textures/flare.png",
      undefined,
      (message, exception) => {
        console.error("[AssetLoader] Error cargando textura:", message, exception);
      }
    );
  }

  private _addSoundFXTasks(): void {
    const sounds: Array<[string, string]> = [
      // player_gesture
      ["player_impulse_to_jump_1", "./soundfxs/player_gesture/impulse_to_jump1.wav"],
      ["player_impulse_to_jump_2", "./soundfxs/player_gesture/impulse_to_jump2.wav"],
      ["player_recibe_damage_1", "./soundfxs/player_gesture/recibe_damage1.wav"],
      ["player_recibe_damage_2", "./soundfxs/player_gesture/recibe_damage2.ogg"],
      ["player_recibe_damage_3", "./soundfxs/player_gesture/recibe_damage3.mp3"],
      ["player_recibe_damage_4", "./soundfxs/player_gesture/recibe_damage4.ogg"],
      ["player_recibe_damage_5", "./soundfxs/player_gesture/recibe_damage5.wav"],
      ["player_going_death_1", "./soundfxs/player_gesture/going_death1.wav"],
      ["player_going_death_2", "./soundfxs/player_gesture/going_death2.mp3"],

      // projectile_impact
      ["projectile_against_player_1", "./soundfxs/projectile_impact/against_player1.wav"],
      ["projectile_against_playground_1", "./soundfxs/projectile_impact/against_playground.ogg"],

      // freesbe_impact
      ["freesbe_against_metal_1", "./soundfxs/freesbe_impact/against_metal1.wav"],
      ["freesbe_against_metal_2", "./soundfxs/freesbe_impact/against_metal2.wav"],

      // freesbe_throw
      ["freesbe_woosh_1", "./soundfxs/freesbe_throw/freesbe-woosh1.wav"],

      // enemy_gesture
      ["enemy_collapsed_1", "./soundfxs/enemy_gesture/enemy_collapsed1.wav"],
      ["enemy_collapsed_2", "./soundfxs/enemy_gesture/enemy_collapsed2.wav"],
    ];

    sounds.forEach(([name, url]) => {
      this.addBinaryFileTask(name, url, undefined, (msg) => {
        console.warn(`[AssetLoader] No se pudo cargar sonido ${name}:`, msg);
      });
    });
  }

}