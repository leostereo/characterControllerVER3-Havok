import type { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { AssetLoader, type LoadedAssets } from "@/utils/AssetsLoader";
import { Player } from "@/player/Player";
import { PlayGround } from "@/playground/PlayGround";
import { ParticlesManager } from "@/game/effects/ParticlesManager";
import { setUI } from "@/game/hud/hud";
import { playerConfig } from "@/config/GameConfig";
import { GameStateMachine } from "./stateMachines/GameStateMachine";
import { GameController } from "./controllers/GameController";
import { GameState } from "./types/GameState";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { SplashScreen } from "@/screens/SplashScreen";

export class Game {
  private stateMachine  = new GameStateMachine();
  private controller:   GameController;
  private assetLoader:  AssetLoader;
  private player:       Player | null = null;

  private loadingScreen = new LoadingScreen();
  private splashScreen  = new SplashScreen();

  constructor(
    private scene:  Scene,
    private engine: Engine | WebGPUEngine
  ) {
    this.controller  = new GameController(scene, engine, this.stateMachine);
    this.assetLoader = new AssetLoader(scene);
    this._registerStateHandlers();
    void this.init();
  }

  // ── Punto de entrada ──────────────────────────────────────────

  async init(): Promise<void> {
    this._registerSplashCallback();
    await this.loadComponents();
  }

  async loadComponents(): Promise<void> {
    this.assetLoader.addDefaultTasks();
    this.assetLoader.load(
      (assets) => this._onAssetsLoaded(assets),
      (remaining, total) => this._onLoadingProgress(remaining, total)
    );
  }

  // ── API pública ───────────────────────────────────────────────

  start(): void { this.controller.start(); }
  pause(): void { this.controller.pause(); }
  resume(): void { this.controller.resume(); }
  gameOver(): void { this.controller.gameOver(); }

  getState(): GameState { return this.stateMachine.current; }

  // ── Callbacks del loader ──────────────────────────────────────

  private _onLoadingProgress(remaining: number, total: number): void {
    const percent = ((total - remaining) / total) * 100;
    this.loadingScreen.setProgress(percent);
  }

  private _onAssetsLoaded(assets: LoadedAssets): void {
    this._initGame(assets);
    this.loadingScreen.hide();
    this.splashScreen.show();
  }

  // ── Inicialización del juego ──────────────────────────────────

  private _initGame(assets: LoadedAssets): void {
    const characterMeshes     = assets.meshes["characterTask"];
    const characterAnimations = assets.animations["characterTask"];
    const particleTexture     = assets.textures["emiterTextureTask"];

    ParticlesManager.initialize(this.scene, particleTexture);

    if (characterMeshes?.length > 0) {
      this.player = new Player(
        this.scene,
        new Vector3(0, 0.9, 0),
        characterMeshes[0],
        characterAnimations,
        -0.9
      );
    }

    new PlayGround(this.scene, playerConfig.player1.player1RaycastDetectableName);

    void setUI(this.scene);

    this.stateMachine.transition(GameState.READY);
  }

  // ── Handlers de estado ────────────────────────────────────────

  private _registerStateHandlers(): void {
    this.stateMachine.onEnter(GameState.READY,     () => this._onReady());
    this.stateMachine.onEnter(GameState.PLAYING,   () => this._onPlaying());
    this.stateMachine.onEnter(GameState.PAUSED,    () => this._onPaused());
    this.stateMachine.onEnter(GameState.GAME_OVER, () => this._onGameOver());
  }

  private _onReady(): void {
    // Espera que SplashScreen llame a start() via onContinue
  }

  private _onPlaying(): void {
    console.warn("[Game] Jugando");
  }

  private _onPaused(): void {
    console.warn("[Game] Pausado");
  }

  private _onGameOver(): void {
    console.warn("[Game] Game Over");
  }

  // ── Splash ────────────────────────────────────────────────────

  private _registerSplashCallback(): void {
    this.splashScreen.onContinue(() => {
      this.start();
    });
  }
}