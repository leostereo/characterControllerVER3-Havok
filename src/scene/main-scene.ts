import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import type { Scene } from "@babylonjs/core/scene";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import "@babylonjs/core/Helpers/sceneHelpers";
import { Ground } from "../playground/ground";
import { AssetLoader, type LoadedAssets } from "@/utils/AssetsLoader";
import { Player } from "@/player/Player";
import "@babylonjs/loaders/glTF";
import { setUI } from "@/game/hud/hud";
import { meshNames } from "@/config/GameConfig";

export default class MainScene {
  private camera: ArcRotateCamera;
  private assetLoader: AssetLoader;
  private player: Player | null = null;

  constructor(private scene: Scene, private canvas: HTMLCanvasElement, private engine: Engine | WebGPUEngine) {
    this._setCamera(scene);
    this._setLight(scene);
    this._setEnvironment(scene);
    this.assetLoader = new AssetLoader(this.scene);
    void this.loadComponents();
  }

  _setCamera(scene: Scene): void {
    this.camera = new ArcRotateCamera("camera", Tools.ToRadians(90), Tools.ToRadians(80), 20, Vector3.Zero(), scene);
    this.camera.attachControl(this.canvas, true);
    this.camera.setTarget(Vector3.Zero());
  }

  _setLight(scene: Scene): void {
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.5;
  }

  _setEnvironment(scene: Scene): void {
    scene.createDefaultEnvironment({ createGround: false, createSkybox: false });
  }

  _setPipeLine(): void {
    if (this.scene.activeCamera) {
      const pipeline = new DefaultRenderingPipeline("default-pipeline", false, this.scene, [this.scene.activeCamera]);
      pipeline.fxaaEnabled = true;
      pipeline.samples = 4;
    }
  }

  async loadComponents(): Promise<void> {

    this._addAssetTasks();
    this._addTextureTasks();

    this.assetLoader.load(
      (assets) => this._onAssetsLoaded(assets),
      (remaining, total) => this._onLoadingProgress(remaining, total)
    );

    new Ground(this.scene);

    void setUI(this.scene);

  }

  private _addAssetTasks(): void {
    this.assetLoader.addMeshTask(
      "characterTask",
      "",
      "",
      "./model/ybotV10.glb",
      (meshes) => {
        const alphaJoints = meshes.find(m => m.name === "Alpha_Joints");
        if (alphaJoints) {
          alphaJoints.name = meshNames.player1Raycast;
        }
      },
      (message, exception) => {
        console.error("Error loading character model:", message, exception);
      }
    );
  }

  private _addTextureTasks(): void {
    this.assetLoader.addTextureTask(
      "emiterTextureTask",
      "https://assets.babylonjs.com/textures/flare.png",
      undefined,
      (texture) => {
        console.error("Error loading character texture:", texture);
      }
    )
  }

  private _onAssetsLoaded(assets: LoadedAssets): void {

    console.warn("All assets loaded successfully:", assets);
    const characterMeshes = assets.meshes["characterTask"];
    const characterAnimations = assets.animations["characterTask"];
    const particlesEmiterTexture = assets.textures["emiterTextureTask"]

    // Crear Player con modelo y animaciones cargadas
    if (characterMeshes && characterMeshes.length > 0) {
      this.player = new Player(
        this.scene,
        new Vector3(0, 0.9, 0),
        characterMeshes[0],
        characterAnimations,
        particlesEmiterTexture,
        -0.9
      );
    }
  }

  private _onLoadingProgress(remaining: number, total: number): void {
    const progress = ((total - remaining) / total) * 100;
    console.warn(`Loading progress: ${progress.toFixed(2)}%`);
  }
}