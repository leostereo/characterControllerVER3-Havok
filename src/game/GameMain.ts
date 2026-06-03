import type { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { type LoadedAssets } from "@/utils/AssetsLoader";
import { Player } from "@/player/Player";
import { PlayGround } from "@/playground/PlayGround";
import { ParticlesManager } from "@/game/effects/ParticlesManager";
import { type HudControls, setUI } from "@/game/hud/hud";
import { GameStateMachine } from "./stateMachines/GameStateMachine";
import { GameController } from "./controllers/GameController";
import { GameState } from "./types/GameState";
import { PlayGroundState } from "@/playground/state/PlayGroundState";
import { EnemiesSpawner } from "@/enemies/EnemiesSpawner";
import { enemiesConfig, playerConfig } from "@/config/GameConfig";
import { EventManager } from "./eventManager/eventManager";

export class GameMain {
  private stateMachine = new GameStateMachine();
  private controller: GameController;
  private player: Player | null = null;
  private enemiesSpawner: EnemiesSpawner;
  private playGround: PlayGround;
  private hud: HudControls | null = null;
  private _lastAssets: LoadedAssets;
  private _eventsObserver: ReturnType<typeof EventManager.prototype.subscribe> | null = null;

  private lives = +playerConfig.initialLives;   // ← desde config
  private enemiesDown = 0;
  private totalEnemies = 10;  // ← hardcodeado por ahora

  constructor(
    private scene: Scene,
    private engine: Engine | WebGPUEngine,
    assets: LoadedAssets
  ) {
    this.controller = new GameController(scene, engine, this.stateMachine);

    this._registerStateHandlers();
    void this._initGame(assets);
  }

  // ── API pública ───────────────────────────────────────────────

  start(): void { this.controller.start(); }
  pause(): void { this.controller.pause(); }
  resume(): void { this.controller.resume(); }
  gameOver(): void { this.controller.gameOver(); }
  getState(): GameState { return this.stateMachine.current; }

  // ── Inicialización ────────────────────────────────────────────

  private async _initGame(assets: LoadedAssets): Promise<void> {
    this._lastAssets = assets;   // ← guardar referencia
    const characterMeshes = assets.meshes["characterTask"];
    const characterAnimations = assets.animations["characterTask"];
    const particleTexture = assets.textures["emiterTextureTask"];

    ParticlesManager.initialize(this.scene, particleTexture);

    this.playGround = new PlayGround(this.scene);

    this.enemiesSpawner = new EnemiesSpawner(this.scene);
    await this.playGround.createNavMesh(this.scene);
    this.totalEnemies = this.enemiesSpawner.spawnAll()

    const playerInitPosition = PlayGroundState.getInstance().getSpawnPoint();

    if (characterMeshes?.length > 0 && this.player === null) {
      this.player = new Player(
        this.scene,
        playerInitPosition,
        characterMeshes[0],
        characterAnimations,
        -0.9
      );
    }

    this.hud = await setUI(this.scene);
    this.hud.updateLives(this.lives);
    this.hud.updateEnemiesDown(this.enemiesDown, this.totalEnemies);

    this._subscribeToEvents();

    this.stateMachine.transition(GameState.READY);
  }

  // ─────────────────────────────────────────────
  //  EVENTOS
  // ─────────────────────────────────────────────
  private _subscribeToEvents(): void {
    const em = EventManager.getInstance();

    // remover el anterior si existe
    if (this._eventsObserver) {
      em.unsubscribe(this._eventsObserver);
      this._eventsObserver = null;
    }

    this._eventsObserver = em.subscribe((event) => {
      if (event.type === "player_damaged") this._handlePlayerDamage();
      if (event.type === "enemy_destroyed") this._handleEnemyDestroyed();
    });
  }

  private _handlePlayerDamage(): void {
    this.lives = Math.max(0, this.lives - 1);
    this.hud?.updateLives(this.lives);

    // notificar a todos los que necesiten reaccionar
    EventManager.getInstance().emit({
      type: "player_hit",
      source: "game",
      sourceType: "other",
      data: { cooldownDuration: enemiesConfig.hitCooldownMs },
    });

    if (this.lives <= 0) {
      this.stateMachine.transition(GameState.GAME_OVER);
    }
  }

  private _handleEnemyDestroyed(): void {
    this.enemiesDown++;
    this.hud?.updateEnemiesDown(this.enemiesDown, this.totalEnemies);

    if (this.enemiesDown >= this.totalEnemies) {
      this.stateMachine.transition(GameState.WIN);
    }
  }

  // ─────────────────────────────────────────────
  //  HANDLERS DE ESTADO
  // ─────────────────────────────────────────────

  // ── Handlers de estado ────────────────────────────────────────

  private _registerStateHandlers(): void {
    this.stateMachine.onEnter(GameState.READY, () => this._onReady());
    this.stateMachine.onEnter(GameState.PLAYING, () => this._onPlaying());
    this.stateMachine.onEnter(GameState.PAUSED, () => this._onPaused());
    this.stateMachine.onEnter(GameState.GAME_OVER, () => this._onGameOver());
    this.stateMachine.onEnter(GameState.WIN, () => this._onWin());  // ← nuevo
  }

  private _onReady(): void { }

  private _onPlaying(): void {
    console.warn("[Game] Jugando");
  }

  private _onPaused(): void {
    console.warn("[Game] Pausado");
  }

  private _onGameOver(): void {
    this.hud?.showGameOver();
    EventManager.getInstance().emit({
      type: "game_over",
      source: "game",
      sourceType: "other",
      data: {},
    });
    this.enemiesSpawner.dispatch();             ///quitar al final

    this.player?.setPlayerGameOver();
    this._registerRestartListener();
  }

  private _onWin(): void {
    this.hud?.showWin();
    this._registerRestartListener();
  }

  private _registerRestartListener(): void {
    const obs = this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.event.key.toLowerCase() === "r") {
        this.scene.onKeyboardObservable.remove(obs);
        void this._restartGame();
      }
    });
  }

  private async _restartGame(): Promise<void> {
    // limpiar observer de eventos
    EventManager.getInstance().clearAll();
    if (this._eventsObserver) {
      EventManager.getInstance().unsubscribe(this._eventsObserver);
      this._eventsObserver = null;
    }

    this.hud?.dispose();
    this.hud = null;
    this.enemiesSpawner.dispatch();
    this.playGround.dispatch();
    this.player?.dispatch();
    this.player = null;

    this.lives = playerConfig.initialLives;
    this.enemiesDown = 0;

    this.stateMachine.reset();
    await this._initGame(this._lastAssets);

    // saltar directamente a PLAYING en el restart
    this.stateMachine.transition(GameState.PLAYING);
  }

}