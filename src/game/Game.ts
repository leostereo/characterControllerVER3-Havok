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
import { playerConfig } from "@/config/GameConfig";
import { EventManager } from "./eventManager/eventManager";

export class Game {
  private stateMachine = new GameStateMachine();
  private controller:  GameController;
  private player:      Player | null = null;
  private enemiesSpawner: EnemiesSpawner;
  private playGround: PlayGround;
  private hud:            HudControls | null = null;

  private lives = +playerConfig.initialLives;   // ← desde config
  private enemiesDown = 0;
  private totalEnemies = 10;  // ← hardcodeado por ahora

  constructor(
    private scene:  Scene,
    private engine: Engine | WebGPUEngine,
    assets: LoadedAssets
  ) {
    this.controller = new GameController(scene, engine, this.stateMachine);

    this._registerStateHandlers();
    void this._initGame(assets);
  }

  // ── API pública ───────────────────────────────────────────────

  start():void    { this.controller.start();    }
  pause():void    { this.controller.pause();    }
  resume():void   { this.controller.resume();   }
  gameOver():void { this.controller.gameOver(); }

  getState(): GameState { return this.stateMachine.current; }

  // ── Inicialización ────────────────────────────────────────────

  private async _initGame(assets: LoadedAssets): Promise<void> {
    const characterMeshes     = assets.meshes["characterTask"];
    const characterAnimations = assets.animations["characterTask"];
    const particleTexture     = assets.textures["emiterTextureTask"];

    ParticlesManager.initialize(this.scene, particleTexture);

    this.playGround = new PlayGround(this.scene);

    this.enemiesSpawner = new EnemiesSpawner(this.scene);
    await this.playGround.createNavMesh(this.scene);
    this.totalEnemies = this.enemiesSpawner.spawnAll()
    
    const playerInitPosition = PlayGroundState.getInstance().getSpawnPoint();

    if (characterMeshes?.length > 0) {
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

    em.subscribe((event) => {
      if (event.type === "player_damaged") {
        this._handlePlayerDamage();
      }
      if (event.type === "enemy_destroyed") {
        this._handleEnemyDestroyed();
      }
    });
  }

  private _handlePlayerDamage(): void {
    this.lives = Math.max(0, this.lives - 1);
    this.hud?.updateLives(this.lives);

    // cooldown de enemigos — luego
    // this.enemiesSpawner.setCooldown();

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
    this.stateMachine.onEnter(GameState.READY,     () => this._onReady());
    this.stateMachine.onEnter(GameState.PLAYING,   () => this._onPlaying());
    this.stateMachine.onEnter(GameState.PAUSED,    () => this._onPaused());
    this.stateMachine.onEnter(GameState.GAME_OVER, () => this._onGameOver());
    this.stateMachine.onEnter(GameState.WIN,       () => this._onWin());  // ← nuevo
  }

  private _onReady(): void { }

  private _onPlaying(): void {
    console.warn("[Game] Jugando");
  }

  private _onPaused(): void {
    console.warn("[Game] Pausado");
  }

  private _onGameOver(): void {
    this.hud?.showGameOver(() => {
      // restart — por ahora reload de página
      window.location.reload();
    });
  }

  private _onWin(): void {
    this.hud?.showWin(() => {
      window.location.reload();
    });
  }
}