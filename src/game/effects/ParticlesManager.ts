import {
  Color4,
  ParticleSystem,
  type Scene,
  type Texture,
  Vector3,
} from "@babylonjs/core";

export class ParticlesManager {

  private static instance: ParticlesManager;

  private scene:                   Scene;
  private particlesEmiterTexture:  Texture;
  private particleSystem:          ParticleSystem;

  private constructor(scene: Scene, particlesEmiterTexture: Texture) {
    this.scene                  = scene;
    this.particlesEmiterTexture = particlesEmiterTexture;
    this._initThrowingParticleSystem();
  }

  // ─────────────────────────────────────────────
  //  SINGLETON
  // ─────────────────────────────────────────────

  // Llamar una vez al inicio del juego con scene y texture
  static initialize(scene: Scene, particlesEmiterTexture: Texture): ParticlesManager {
    if (!ParticlesManager.instance) {
      ParticlesManager.instance = new ParticlesManager(scene, particlesEmiterTexture);
    }
    return ParticlesManager.instance;
  }

  // Llamar desde cualquier clase sin parámetros
  static getInstance(): ParticlesManager {
    if (!ParticlesManager.instance) {
      throw new Error("[ParticlesManager] No inicializado. Llamar initialize() primero.");
    }
    return ParticlesManager.instance;
  }

    private _initThrowingParticleSystem(): void {
        this.particleSystem = new ParticleSystem("particles", 2000, this.scene);
        this.particleSystem.particleTexture = this.particlesEmiterTexture;
        this.particleSystem.color1 = new Color4(0.2, 0.5, 1.0, 1.0);
        this.particleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
        this.particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);

        // Size of each particle (random between...
        this.particleSystem.minSize = 0.1;
        this.particleSystem.maxSize = 0.5;

        // Life time of each particle (random between...
        this.particleSystem.minLifeTime = 0.3;
        this.particleSystem.maxLifeTime = 2.5;

        // Emission rate
        this.particleSystem.emitRate = 800;

        // Speed
        this.particleSystem.minEmitPower = 2;
        this.particleSystem.maxEmitPower = 4;
        this.particleSystem.updateSpeed = 0.005;

    }

    public emitThrowingParticles(position: Vector3, forward: Vector3): void {

        const emiterposition = position.clone();
        const emiterOffset = forward.clone();
        emiterOffset.scaleInPlace(1.8);
        emiterposition._y += 0.4;
        // emiterposition.subtractInPlace(forward.scale(4))
        emiterposition._x += emiterOffset._x;
        emiterposition._z += emiterOffset._z;
        const emiterDirection = forward.clone();

        this.particleSystem.emitter = emiterposition // the starting location
        this.particleSystem.direction1 = emiterDirection.scaleInPlace(5)

        this.particleSystem.start();
        setTimeout(() => {
            this.particleSystem.stop();
        }, 500)

    }

    public generateCanionDestruction(position: Vector3): void {

        // ── EXPLOSIÓN PRINCIPAL — bola de fuego ──────────────
        const explosion = new ParticleSystem("canion_explosion", 300, this.scene);
        explosion.particleTexture = this.particlesEmiterTexture;

        explosion.emitter = position.clone();
        explosion.minEmitBox = new Vector3(-0.3, 0, -0.3);
        explosion.maxEmitBox = new Vector3(0.3, 0.5, 0.3);

        explosion.color1 = new Color4(1.0, 0.5, 0.0, 1.0); // naranja
        explosion.color2 = new Color4(1.0, 0.1, 0.0, 1.0); // rojo
        explosion.colorDead = new Color4(0.1, 0.1, 0.1, 0.0); // humo

        explosion.minSize = 0.4;
        explosion.maxSize = 1.5;
        explosion.minLifeTime = 0.2;
        explosion.maxLifeTime = 0.6;
        explosion.emitRate = 800;

        explosion.minEmitPower = 5;
        explosion.maxEmitPower = 10;
        explosion.updateSpeed = 0.02;

        explosion.direction1 = new Vector3(-3, 6, -3);
        explosion.direction2 = new Vector3(3, 8, 3);

        explosion.start();
        setTimeout(() => {
            explosion.stop();
            setTimeout(() => explosion.dispose(), 1000);
        }, 200);

        // ── HUMO — se queda flotando un poco más ─────────────
        const smoke = new ParticleSystem("canion_smoke", 150, this.scene);
        smoke.particleTexture = this.particlesEmiterTexture;

        smoke.emitter = position.clone();
        smoke.minEmitBox = new Vector3(-0.2, 0, -0.2);
        smoke.maxEmitBox = new Vector3(0.2, 0, 0.2);

        smoke.color1 = new Color4(0.3, 0.3, 0.3, 0.6);
        smoke.color2 = new Color4(0.2, 0.2, 0.2, 0.4);
        smoke.colorDead = new Color4(0.1, 0.1, 0.1, 0.0);

        smoke.minSize = 0.5;
        smoke.maxSize = 1.8;
        smoke.minLifeTime = 0.8;
        smoke.maxLifeTime = 2.0;
        smoke.emitRate = 100;

        smoke.minEmitPower = 1;
        smoke.maxEmitPower = 2;
        smoke.updateSpeed = 0.01;

        smoke.direction1 = new Vector3(-0.5, 3, -0.5);
        smoke.direction2 = new Vector3(0.5, 5, 0.5);

        smoke.start();
        setTimeout(() => {
            smoke.stop();
            setTimeout(() => smoke.dispose(), 2500);
        }, 600);
    }

}