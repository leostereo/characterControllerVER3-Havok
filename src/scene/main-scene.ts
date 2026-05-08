import type { Engine } from "@babylonjs/core/Engines/engine";
import type { Scene } from "@babylonjs/core/scene";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import "@babylonjs/core/Helpers/sceneHelpers";
import "@babylonjs/loaders/glTF";

import { AssetLoader, type LoadedAssets } from "@/utils/AssetsLoader";
import { ScreenManager } from "@/game/managers/ScreenManager";
import { Game } from "@/game/Game";
import type { KeyboardInfo, Observer } from "@babylonjs/core";

export default class MainScene {
  private assetLoader: AssetLoader;
  private screenManager: ScreenManager;
  private game: Game | null = null;
  private keyBoardObserver: Observer<KeyboardInfo>;

  constructor(
    private scene: Scene,
    private canvas: HTMLCanvasElement,
    private engine: Engine | WebGPUEngine
  ) {
    this._disableNativeLoadingScreen();
    this.screenManager = ScreenManager.getInstance();
    this.assetLoader = new AssetLoader(scene);

    this.screenManager.displayLoadingScreen();
    this._loadAssets();
  }

  private _loadAssets(): void {
    this.assetLoader.addDefaultTasks();
    this.assetLoader.load(
      (assets) => this._onAssetsLoaded(assets),
      (remaining, total) => {
        const percent = ((total - remaining) / total) * 100;
        this.screenManager.setProgress(percent);
      }
    );
  }

  private _onAssetsLoaded(assets: LoadedAssets): void {
    this.game = new Game(this.scene, this.engine, assets);
    this.screenManager.showSplash();
    this._registerKeyObserver();
  }

  private _registerKeyObserver(): void {
    this.canvas.focus();
    this.keyBoardObserver = this.scene.onKeyboardObservable.add(() => {
      this._gameStart();
      this.scene.onKeyboardObservable.remove(this.keyBoardObserver);
    })

  }

  private _gameStart(): void {
    this.screenManager.hideLoadingScreen();
    this.game?.start();
  }

  private _disableNativeLoadingScreen(): void {
    this.engine.loadingScreen = {
      displayLoadingUI: ():void => { },
      hideLoadingUI: ():void => { },
      loadingUIText: "",
      loadingUIBackgroundColor: "",
    };
  }
}