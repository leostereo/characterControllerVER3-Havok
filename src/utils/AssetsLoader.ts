import { AssetsManager, Scene, AbstractMesh, AnimationGroup, Texture } from "@babylonjs/core";

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
    onError?: (message: string, exception?: any) => void
  ): void {
    const task = this.assetsManager.addMeshTask(name, meshNames, rootUrl, filename);
    task.onSuccess = (task) => {
      this.loadedAssets.meshes[name] = task.loadedMeshes as AbstractMesh[];
      this.loadedAssets.animations[name] = task.loadedAnimationGroups;
      if (onSuccess) onSuccess(task.loadedMeshes as AbstractMesh[], task.loadedAnimationGroups);
    };
    if (onError) {
      task.onError = (task, message, exception) => onError(message ?? 'ERRORGEN', exception);
    }
  }

  /**
   * Agrega una tarea para cargar una textura.
   */
  addTextureTask(
    name: string,
    url: string,
    onSuccess?: (texture: Texture) => void,
    onError?: (message: string, exception?: any) => void
  ): void {
    const task = this.assetsManager.addTextureTask(name, url);
    task.onSuccess = (task) => {
      this.loadedAssets.textures[name] = task.texture;
      if (onSuccess) onSuccess(task.texture);
    };
    if (onError) {
      task.onError = (task, message, exception) => onError(message ?? 'ERRORGEN', exception);
    }
  }

  /**
   * Agrega una tarea para cargar un archivo binario (ej: sonidos).
   */
  addBinaryFileTask(
    name: string,
    url: string,
    onSuccess?: (data: ArrayBuffer) => void,
    onError?: (message: string, exception?: any) => void
  ): void {
    const task = this.assetsManager.addBinaryFileTask(name, url);
    task.onSuccess = (task) => {
      this.loadedAssets.binaries[name] = task.data;
      if (onSuccess) onSuccess(task.data);
    };
    if (onError) {
      task.onError = (task, message, exception) => onError(message ?? 'ERRORGEN', exception);
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

  /**
   * Inicia la carga de todos los assets.
   */
  load(
    onFinish?: (assets: LoadedAssets) => void,
    onProgress?: (remainingCount: number, totalCount: number, task: any) => void
  ): void {
    if (onFinish) {
      this.assetsManager.onFinish = () => onFinish(this.loadedAssets);
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
}