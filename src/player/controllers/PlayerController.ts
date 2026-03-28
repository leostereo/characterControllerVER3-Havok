import {
  Scene,
  Vector3,
  MeshBuilder,
  AbstractMesh,
  PhysicsCharacterController,
  CharacterSupportedState,
  AnimationGroup,
  Quaternion,
  Matrix,
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
  private meshOffset = new Vector3(0, 0, 0);

  constructor(scene: Scene, startPosition: Vector3) {
    this.scene = scene;
    this.startPosition = startPosition.clone();

    // Crear cápsula visual con flecha indicadora
    this.characterMesh = MeshBuilder.CreateCapsule("playerCapsule", { height: 1.8, radius: 0.4 }, scene);
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

  /**
   * Establece el modelo del personaje reemplazando la cápsula.
   */
  setCharacterModel(mesh: AbstractMesh): void {
    // Posicionar el nuevo mesh
    mesh.position.copyFrom(this.startPosition.add(this.meshOffset));
    mesh.rotation.copyFrom(this.characterMesh.rotation);
    mesh.scaling.copyFrom(this.characterMesh.scaling);

    // Reemplazar el mesh visual
    this.characterMesh.dispose();
    this.characterMesh = mesh;

    // Sincronizar la posición del controller físico
    this.controller.setPosition(mesh.position.clone());

    console.log("Character model set:", mesh.name);
  }

  /**
   * Establece el offset Y del mesh si es necesario.
   */
  setMeshYOffset(y: number): void {
    this.meshOffset.y = y;
    // Si el mesh ya está establecido, ajustar su posición
    if (this.characterMesh) {
      this.characterMesh.position.y = this.startPosition.y + y;
      this.controller.setPosition(this.characterMesh.position.clone());
    }
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

      //handle rotation

      const turn = (this.keys["KeyD"] ? 1 : 0) - (this.keys["KeyA"] ? 1 : 0);
      if (turn !== 0) {
        if (!this.characterMesh.rotationQuaternion) {
          this.characterMesh.rotationQuaternion = this.characterMesh.rotation.toQuaternion();
        }
        const deltaYaw = turn * ROTATE_SPEED * dt;
        const deltaRot = Quaternion.RotationAxis(Vector3.Up(), deltaYaw);
        this.characterMesh.rotationQuaternion = deltaRot.multiply(this.characterMesh.rotationQuaternion);
      }

      // const quat = this.characterMesh.rotationQuaternion ?? Quaternion.Identity();
      // const rotMatrix = Matrix.Identity();
      // Matrix.FromQuaternionToRef(quat, rotMatrix);
      // const forward = Vector3.TransformNormal(Vector3.Forward(), rotMatrix);

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

      // Sincronizar mesh con controller + offset
      const physPos = this.controller.getPosition();
      this.characterMesh.position.copyFrom(physPos.add(this.meshOffset));

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