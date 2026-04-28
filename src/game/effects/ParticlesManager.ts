import {
  Color4,
  ParticleSystem,
  type Scene,
  type Texture,
  Vector3,
} from "@babylonjs/core";

export class ParticlesManager {

  private static instance: ParticlesManager;

  private scene: Scene;
  private particlesEmiterTexture: Texture;
  private particleSystem: ParticleSystem;

  private constructor(scene: Scene, particlesEmiterTexture: Texture) {
    this.scene = scene;
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
    // ── DESINTEGRACIÓN DIGITAL — cristales azules rompiéndose ──────────────
    const crystalFragments = new ParticleSystem("canion_crystal_fragments", 250, this.scene);
    crystalFragments.particleTexture = this.particlesEmiterTexture;

    crystalFragments.emitter = position.clone();
    crystalFragments.minEmitBox = new Vector3(-0.3, 0, -0.3);
    crystalFragments.maxEmitBox = new Vector3(0.3, 0.4, 0.3);

    crystalFragments.color1 = new Color4(0.2, 0.8, 1.0, 0.9); // azul Tron brillante
    crystalFragments.color2 = new Color4(0.1, 0.5, 1.0, 0.7); // azul Tron mate
    crystalFragments.colorDead = new Color4(0.0, 0.2, 0.5, 0.0); // azul oscuro desvanecido

    crystalFragments.minSize = 0.05;
    crystalFragments.maxSize = 0.3;
    crystalFragments.minLifeTime = 0.8;
    crystalFragments.maxLifeTime = 2.5;
    crystalFragments.emitRate = 600;

    crystalFragments.minEmitPower = 6;
    crystalFragments.maxEmitPower = 12;
    crystalFragments.updateSpeed = 0.015;

    crystalFragments.direction1 = new Vector3(-4, 3, -4);
    crystalFragments.direction2 = new Vector3(4, 7, 4);

    // Gravedad ligera para que floten un poco antes de caer
    crystalFragments.gravity = new Vector3(0, -4.0, 0);

    crystalFragments.start();
    setTimeout(() => {
      crystalFragments.stop();
      // setTimeout(() => crystalFragments.dispose(), 3000);
    }, 400);

    // ── CHISPAS DIGITALES — líneas de código o energía ──────────────
    const digitalSparks = new ParticleSystem("canion_digital_sparks", 120, this.scene);
    digitalSparks.particleTexture = this.particlesEmiterTexture;

    digitalSparks.emitter = position.clone();
    digitalSparks.minEmitBox = new Vector3(-0.1, 0, -0.1);
    digitalSparks.maxEmitBox = new Vector3(0.1, 0.2, 0.1);

    digitalSparks.color1 = new Color4(0.0, 1.0, 1.0, 1.0); // cian brillante
    digitalSparks.color2 = new Color4(0.5, 1.0, 1.0, 1.0); // cian mate
    digitalSparks.colorDead = new Color4(0.0, 0.5, 0.5, 0.0); // cian desvanecido

    digitalSparks.minSize = 0.02;
    digitalSparks.maxSize = 0.08;
    digitalSparks.minLifeTime = 0.4;
    digitalSparks.maxLifeTime = 1.0;
    digitalSparks.emitRate = 400;

    digitalSparks.minEmitPower = 8;
    digitalSparks.maxEmitPower = 15;
    digitalSparks.updateSpeed = 0.025;

    digitalSparks.direction1 = new Vector3(-3, 5, -3);
    digitalSparks.direction2 = new Vector3(3, 8, 3);

    digitalSparks.start();
    setTimeout(() => {
      digitalSparks.stop();
      // setTimeout(() => digitalSparks.dispose(), 1200);
    }, 500);

    // ── NIEBLA DIGITAL — efecto residual ──────────────
    const digitalFog = new ParticleSystem("canion_digital_fog", 100, this.scene);
    digitalFog.particleTexture = this.particlesEmiterTexture;

    digitalFog.emitter = position.clone();
    digitalFog.minEmitBox = new Vector3(-0.4, 0, -0.4);
    digitalFog.maxEmitBox = new Vector3(0.4, 0, 0.4);

    digitalFog.color1 = new Color4(0.1, 0.3, 0.8, 0.3);
    digitalFog.color2 = new Color4(0.05, 0.2, 0.6, 0.2);
    digitalFog.colorDead = new Color4(0.0, 0.1, 0.3, 0.0);

    digitalFog.minSize = 1.0;
    digitalFog.maxSize = 2.5;
    digitalFog.minLifeTime = 2.0;
    digitalFog.maxLifeTime = 5.0;
    digitalFog.emitRate = 60;

    digitalFog.minEmitPower = 0.3;
    digitalFog.maxEmitPower = 1.0;
    digitalFog.updateSpeed = 0.008;

    digitalFog.direction1 = new Vector3(-0.2, 1, -0.2);
    digitalFog.direction2 = new Vector3(0.2, 3, 0.2);

    digitalFog.start();
    setTimeout(() => {
      digitalFog.stop();
      // setTimeout(() => digitalFog.dispose(), 6000);
    }, 1000);
  }

}