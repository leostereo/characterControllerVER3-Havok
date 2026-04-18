import { Color4, ParticleSystem, type Scene, type Texture, type Vector3 } from "@babylonjs/core";

export class ParticlesManager {
    private scene: Scene;
    private particlesEmiterTexture: Texture;
    private particleSystem: ParticleSystem;

    constructor(scene: Scene, particlesEmiterTexture: Texture) {

        this.scene = scene;
        this.particlesEmiterTexture = particlesEmiterTexture;
        this._initThrowingParticleSystem();
    }

    private _initThrowingParticleSystem():void {
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

    public emitThrowingParticles(position: Vector3, forward: Vector3):void {
        
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


    // private createThrowParticlesSystem(color) {

    //     // Create a particle system
    //     var particleSystem = new ParticleSystem("particles", 2000, this.scene);

    //     //Texture of each particle
    //     particleSystem.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png");

    //     const emiterposition = this.orientation.position.clone();
    //     const emiterOffset = this.orientation.pointingVector.clone();
    //     emiterOffset.scaleInPlace(5.5);
    //     emiterposition._y += 1.2;
    //     emiterposition._x + emiterOffset._x;
    //     emiterposition._z += emiterOffset._z;
    //     const emiterDirection = this.orientation.pointingVector.clone();

    //     particleSystem.emitter = emiterposition // the starting location
    //     particleSystem.direction1 = emiterDirection.scaleInPlace(5)

    //     // Colors of all particles
    //     particleSystem.color1 = color;
    //     particleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
    //     particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);

    //     // Size of each particle (random between...
    //     particleSystem.minSize = 0.1;
    //     particleSystem.maxSize = 0.5;

    //     // Life time of each particle (random between...
    //     particleSystem.minLifeTime = 0.3;
    //     particleSystem.maxLifeTime = 2.5;

    //     // Emission rate
    //     particleSystem.emitRate = 800;


    //     /******* Emission Space ********/
    //     // particleSystem.createConeEmitter(radius, angle);

    //     // Speed
    //     particleSystem.minEmitPower = 2;
    //     particleSystem.maxEmitPower = 4;
    //     particleSystem.updateSpeed = 0.005;


    //     //                Start the particle system
    //     particleSystem.start();
    //     setTimeout(() => {
    //         particleSystem.stop();
    //     }, 500)
    //     setTimeout(() => {
    //         particleSystem.dispose();
    //     }, 1500)

    // }

    // private createImpactParticlesSystem(color) {
    //     var particleSystem = new ParticleSystem("particles", 4000, this.scene);

    //     //Texture of each particle
    //     particleSystem.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png");

    //     // Where the particles come from
    //     particleSystem.emitter = this.orientation.position; // the starting location

    //     // Colors of all particles
    //     particleSystem.color1 = color;
    //     particleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
    //     particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);

    //     // Size of each particle (random between...
    //     particleSystem.minSize = 0.1;
    //     particleSystem.maxSize = 0.5;

    //     // Life time of each particle (random between...
    //     particleSystem.minLifeTime = 0.1;
    //     particleSystem.maxLifeTime = 0.5;

    //     // Emission rate
    //     particleSystem.emitRate = 500;


    //     /******* Emission Space ********/
    //     //particleSystem.createPointEmitter(collision.normal.scaleInPlace(-1),collision.normal);
    //     particleSystem.createSphereEmitter(3);

    //     // Speed
    //     particleSystem.minEmitPower = 1;
    //     particleSystem.maxEmitPower = 6;
    //     particleSystem.updateSpeed = 0.005;

    //     // Start the particle system
    //     particleSystem.start();

    //     setTimeout(() => {
    //         particleSystem.stop();
    //     }, 500);

    //     setTimeout(() => {
    //         particleSystem.dispose();
    //     }, 1500);
    // }
}