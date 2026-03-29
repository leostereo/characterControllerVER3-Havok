import {
  type Scene,
  Vector3,
  MeshBuilder,
  type AbstractMesh,
  PhysicsCharacterController,
  CharacterSupportedState,
  type AnimationGroup,
  Quaternion,
  type CharacterSurfaceInfo,
} from "@babylonjs/core";

const ON_GROUND_SPEED = 10.0;
const IN_AIR_SPEED = 8.0;
const JUMP_HEIGHT = 1.5;
const GRAVITY = new Vector3(0, -18, 0);
const ROTATE_SPEED = 2;
const RUN_MULTIPLIER = 1.8;

type CharacterState = "IN_AIR" | "ON_GROUND" | "START_JUMP";

export class PlayerController {
  private readonly scene: Scene;
  private controller: PhysicsCharacterController;
  private characterMesh: AbstractMesh;
  private startPosition: Vector3;
  private meshOffset = new Vector3(0, 0, 0);

  // Estado de la máquina
  private state: CharacterState = "IN_AIR";
  private wantJump = false;
  private goingBack = false;

  // Input
  private inputDirection = new Vector3(0, 0, 0);
  private readonly keys: Record<string, boolean> = {};

  // Para getters
  private localVelocity = Vector3.Zero();
  private grounded = false;

  public animationGroups: AnimationGroup[] = [];

  constructor(scene: Scene, startPosition: Vector3) {
    this.scene = scene;
    this.startPosition = startPosition.clone();

    this.characterMesh = MeshBuilder.CreateCapsule(
      "playerCapsule",
      { height: 1.8, radius: 0.4 },
      scene
    );
    this.characterMesh.position.copyFrom(this.startPosition);

    // Flecha direccional
    const arrow = MeshBuilder.CreateBox(
      "arrow",
      { width: 0.2, height: 0.2, depth: 1 },
      scene
    );
    arrow.parent = this.characterMesh;
    arrow.position.z = 0.5;

    this.controller = new PhysicsCharacterController(
      this.startPosition,
      { capsuleHeight: 1.8, capsuleRadius: 0.4 },
      scene
    );

    this.setupInput();
    this.setupGameLoop();
  }

  // ── Máquina de estados ───────────────────────────────────────────────

  private getNextState(support: CharacterSurfaceInfo): CharacterState {
    if (this.state === "IN_AIR") {
      return support.supportedState === CharacterSupportedState.SUPPORTED
        ? "ON_GROUND"
        : "IN_AIR";
    }

    if (this.state === "ON_GROUND") {
      if (support.supportedState !== CharacterSupportedState.SUPPORTED) {
        return "IN_AIR";
      }
      return this.wantJump ? "START_JUMP" : "ON_GROUND";
    }

    if (this.state === "START_JUMP") {
      return "IN_AIR";
    }

    return "IN_AIR";
  }

  private getDesiredVelocity(
    dt: number,
    support: CharacterSurfaceInfo,
    currentVelocity: Vector3
  ): Vector3 {
    // Actualizar estado
    const nextState = this.getNextState(support);
    if (nextState !== this.state) {
      this.state = nextState;
    }

    const upWorld = GRAVITY.normalizeToNew().scaleInPlace(-1);
    const characterOrientation = this.characterMesh.rotationQuaternion
      ?? Quaternion.FromEulerAngles(0, this.characterMesh.rotation.y, 0);

    const forwardWorld = new Vector3(0, 0, 1).applyRotationQuaternion(characterOrientation);
    const running = (this.keys["ShiftLeft"] || this.keys["ShiftRight"]) === true;

    if (this.state === "IN_AIR") {
      const speed = IN_AIR_SPEED * (running ? RUN_MULTIPLIER : 1);
      const desiredVelocity = this.inputDirection
        .scale(speed)
        .applyRotationQuaternion(characterOrientation);

      const outputVelocity = this.controller.calculateMovement(
        dt, forwardWorld, upWorld,
        currentVelocity, Vector3.ZeroReadOnly, desiredVelocity, upWorld
      );

      // Restaurar componente vertical original + gravedad
      outputVelocity.addInPlace(upWorld.scale(-outputVelocity.dot(upWorld)));
      outputVelocity.addInPlace(upWorld.scale(currentVelocity.dot(upWorld)));
      outputVelocity.addInPlace(GRAVITY.scale(dt));

      return outputVelocity;

    } else if (this.state === "ON_GROUND") {
      const speed = ON_GROUND_SPEED * (running ? RUN_MULTIPLIER : 1);
      const desiredVelocity = this.inputDirection
        .scale(speed)
        .applyRotationQuaternion(characterOrientation);

      let outputVelocity = this.controller.calculateMovement(
        dt, forwardWorld, support.averageSurfaceNormal,
        currentVelocity, support.averageSurfaceVelocity, desiredVelocity, upWorld
      );

      // Proyección horizontal — clave para plataformas en movimiento
      outputVelocity.subtractInPlace(support.averageSurfaceVelocity);
      const inv1k = 1e-3;
      if (outputVelocity.dot(upWorld) > inv1k) {
        const velLen = outputVelocity.length();
        outputVelocity.normalizeFromLength(velLen);
        const horizLen = velLen / support.averageSurfaceNormal.dot(upWorld);
        const c = support.averageSurfaceNormal.cross(outputVelocity);
        outputVelocity = c.cross(upWorld);
        outputVelocity.scaleInPlace(horizLen);
      }
      outputVelocity.addInPlace(support.averageSurfaceVelocity);

      return outputVelocity;

    } else if (this.state === "START_JUMP") {
      const u = Math.sqrt(2 * GRAVITY.length() * JUMP_HEIGHT);
      const curRelVel = currentVelocity.dot(upWorld);
      return currentVelocity.add(upWorld.scale(u - curRelVel));
    }

    return Vector3.Zero();
  }

  // ── Input ────────────────────────────────────────────────────────────

  private setupInput(): void {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      // Actualizar inputDirection
      if (e.code === "KeyW") this.inputDirection.z = 1;
      if (e.code === "KeyS") { this.inputDirection.z = -1; this.goingBack = true; }
      // if (e.code === "KeyA") this.inputDirection.x = -1;
      // if (e.code === "KeyD") this.inputDirection.x = 1;
      if (e.code === "Space") this.wantJump = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;

      if (e.code === "KeyW" || e.code === "KeyS") {
        this.inputDirection.z = 0;
        this.goingBack = false;
      }
      // if (e.code === "KeyA" || e.code === "KeyD") this.inputDirection.x = 0;
      if (e.code === "Space") this.wantJump = false;
    });
  }

  // ── Game loop ────────────────────────────────────────────────────────

  private setupGameLoop(): void {
    // Rotación con A/D — en render loop para que sea suave
    this.scene.onBeforeRenderObservable.add(() => {
      const dt = this.scene.getEngine().getDeltaTime() / 1000;
      const turn = ((this.keys["KeyD"] === true) ? 1 : 0) - ((this.keys["KeyA"] === true) ? 1 : 0);

      if (turn !== 0) {
        this.characterMesh.rotationQuaternion ??= Quaternion.FromEulerAngles(
          0, this.characterMesh.rotation.y, 0
        );
        const deltaRot = Quaternion.RotationAxis(Vector3.Up(), turn * ROTATE_SPEED * dt);
        this.characterMesh.rotationQuaternion = deltaRot.multiply(
          this.characterMesh.rotationQuaternion
        );
      }

      // Sincronizar mesh con controller
      const physPos = this.controller.getPosition();
      this.characterMesh.position.copyFrom(physPos.add(this.meshOffset));
    });

    // Física — en onAfterPhysicsObservable como recomienda el playground
    this.scene.onAfterPhysicsObservable.add(() => {
      if (this.scene.deltaTime === undefined) return;
      const dt = this.scene.deltaTime / 1000;
      if (dt === 0) return;

      const down = new Vector3(0, -1, 0);
      const support = this.controller.checkSupport(dt, down);

      console.warn(
        this.meshOffset
      );

      const desiredVelocity = this.getDesiredVelocity(dt, support, this.controller.getVelocity());

      this.controller.setVelocity(desiredVelocity);
      this.controller.integrate(dt, support, GRAVITY);

      // Actualizar getters
      this.grounded = support.supportedState === CharacterSupportedState.SUPPORTED;
      this.localVelocity.copyFrom(desiredVelocity);
    });
  }

  // ── API pública ──────────────────────────────────────────────────────

  setCharacterModel(mesh: AbstractMesh): void {
    mesh.position.copyFrom(this.startPosition.add(this.meshOffset));
    mesh.rotation.copyFrom(this.characterMesh.rotation);
    mesh.scaling.copyFrom(this.characterMesh.scaling);
    this.characterMesh.dispose();
    this.characterMesh = mesh;
    this.controller.setPosition(mesh.position.clone());
  }

  setMeshYOffset(y: number): void {
    this.meshOffset.y = y;
    // if (this.characterMesh) {
    //   this.characterMesh.position.y = this.startPosition.y + y;
    //   this.controller.setPosition(this.characterMesh.position.clone());
    // }
  }

  get targetMesh(): AbstractMesh { return this.characterMesh; }
  get position(): Vector3 { return this.characterMesh.position; }
  get isGrounded(): boolean { return this.grounded; }
  get isGoingBack(): boolean { return this.goingBack; }
  get velocity(): Vector3 { return this.localVelocity; }
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