import {
  Scene,
  Vector3,
  MeshBuilder,
  AbstractMesh,
  PhysicsCharacterController,
  CharacterSupportedState,
  AnimationGroup,
} from "@babylonjs/core";

const MOVE_SPEED = 5;
const RUN_MULTIPLIER = 1.8;
const JUMP_FORCE = 8;
const GRAVITY = 20;
const ROTATE_SPEED = 2;

export class PlayerController {
  private readonly scene: Scene;
  private controller: PhysicsCharacterController;
  private characterMesh: AbstractMesh;
  private startPosition: Vector3;
  private verticalVelocity = 0;
  private readonly keys: Record<string, boolean> = {};
  private grounded = false;
  private localVelocity = Vector3.Zero();
  public animationGroups: AnimationGroup[] = [];

  constructor(scene: Scene, startPosition: Vector3) {
    this.scene = scene;
    this.startPosition = startPosition.clone();

    // Crear cápsula visual con flecha indicadora
    this.characterMesh = MeshBuilder.CreateCapsule("player", { height: 1.8, radius: 0.4 }, scene);
    this.characterMesh.position.copyFrom(this.startPosition);

    // Crear flecha para indicar dirección
    const arrow = MeshBuilder.CreateBox("arrow", { width: 0.2, height: 0.2, depth: 1 }, scene);
    arrow.parent = this.characterMesh;
    arrow.position.z = 0.5; // Adelante del capsule

    // Crear controller físico
    this.controller = new PhysicsCharacterController(
      this.startPosition,
      { capsuleHeight: 1.8, capsuleRadius: 0.4 },
      scene
    );
    this.controller.setPosition(this.startPosition);

    this.setupInput();
    this.setupGameLoop();
  }

  private setupInput(): void {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
  }

  private setupGameLoop(): void {
    this.scene.onBeforeRenderObservable.add(() => {
      const dt = this.scene.getEngine().getDeltaTime() / 1000;
      const down = new Vector3(0, -1, 0);
      const gravity = new Vector3(0, -GRAVITY, 0);
      const support = this.controller.checkSupport(dt, down);
      const isGrounded = support.supportedState === CharacterSupportedState.SUPPORTED;

      // Rotación con A/D
      if (this.keys["KeyA"]) this.characterMesh.rotation.y -= ROTATE_SPEED * dt;
      if (this.keys["KeyD"]) this.characterMesh.rotation.y += ROTATE_SPEED * dt;

      // Dirección forward basada en rotation.y
      const forward = this.characterMesh.forward;
      const running = this.keys["ShiftLeft"] || this.keys["ShiftRight"];
      const speed = MOVE_SPEED * (running ? RUN_MULTIPLIER : 1);

      const velocity = Vector3.Zero();
      if (this.keys["KeyW"]) velocity.addInPlace(forward.scale(speed));
      if (this.keys["KeyS"]) velocity.addInPlace(forward.scale(-speed));

      // Salto y gravedad
      if (isGrounded) {
        this.verticalVelocity = this.keys["Space"] ? JUMP_FORCE : 0;
      } else {
        this.verticalVelocity -= GRAVITY * dt;
      }
      velocity.y = this.verticalVelocity;

      this.controller.setVelocity(velocity);
      this.controller.integrate(dt, support, gravity);

      // Sincronizar mesh con controller
      this.characterMesh.position.copyFrom(this.controller.getPosition());

      this.grounded = isGrounded;
      this.localVelocity.copyFrom(velocity);
    });
  }

  // Getters
  get targetMesh(): AbstractMesh {
    return this.characterMesh;
  }

  get position(): Vector3 {
    return this.characterMesh.position;
  }

  get rotationY(): number {
    return this.characterMesh.rotation.y;
  }

  get isGrounded(): boolean {
    return this.grounded;
  }

  get velocity(): Vector3 {
    return this.localVelocity;
  }

  get speed(): number {
    return new Vector3(this.localVelocity.x, 0, this.localVelocity.z).length();
  }

  get isRunning(): boolean {
    return (this.keys["ShiftLeft"] || this.keys["ShiftRight"]) ?? false;
  }

  dispose(): void {
    this.characterMesh.dispose();
  }
}