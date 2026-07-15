import { Engine } from "@babylonjs/core/Engines/engine";
import type { Scene } from "@babylonjs/core/scene";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import "@babylonjs/core/Helpers/sceneHelpers";
import "@babylonjs/loaders/glTF";

import { AssetLoader, type LoadedAssets } from "@/utils/AssetsLoader";
import { ScreenManager } from "@/game/managers/ScreenManager";
import { GameMain } from "@/game/GameMain";
import type { KeyboardInfo, Observer } from "@babylonjs/core";

export default class MainScene {
  private assetLoader: AssetLoader;
  private screenManager: ScreenManager;
  private game: GameMain | null = null;
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
      (assets) => void this._onAssetsLoaded(assets),  // ← void para manejar async
      (remaining, total) => {
        const percent = ((total - remaining) / total) * 100;
        this.screenManager.setProgress(percent);
      }
    );
  }

  private async _onAssetsLoaded(assets: LoadedAssets): Promise<void> {
    this.game = new GameMain(this.scene, this.engine, assets);

    // esperar que el juego esté completamente inicializado
    await this.game.ready();

    this.screenManager.showSplash();
    this._registerKeyObserver();
  }

  private _registerKeyObserver(): void {
    this.canvas.focus();
    this.keyBoardObserver = this.scene.onKeyboardObservable.add(() => {
      this._gameStart();
      this.scene.onKeyboardObservable.remove(this.keyBoardObserver);
    })
    this._pollGamepadStart();
  }

  private gamepadPollId: number = 0;

  private _pollGamepadStart(): void {
    const check = (): void => {
      const gp = navigator.getGamepads()[0];
      if (gp && gp.buttons.some(b => b.pressed)) {
        this.scene.onKeyboardObservable.remove(this.keyBoardObserver);
        this._gameStart();
        return;
      }
      this.gamepadPollId = requestAnimationFrame(check);
    };
    this.gamepadPollId = requestAnimationFrame(check);
  }

  private _gameStart(): void {
    // inicializar audio engine tras interacción del usuario
    if (Engine.audioEngine) {
      Engine.audioEngine.unlock();
    }
    this.screenManager.hideLoadingScreen();
    this.game?.start();
  }

  private _disableNativeLoadingScreen(): void {
    this.engine.loadingScreen = {
      displayLoadingUI: (): void => { },
      hideLoadingUI: (): void => { },
      loadingUIText: "",
      loadingUIBackgroundColor: "",
    };
  }
}