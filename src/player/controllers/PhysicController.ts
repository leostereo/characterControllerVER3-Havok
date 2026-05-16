import {
  type Scene,
  Vector3,
  MeshBuilder,
  type Mesh,
  type AbstractMesh,
  PhysicsCharacterController,
  CharacterSupportedState,
  type CharacterSurfaceInfo,
  Quaternion,
  PhysicsShapeCapsule,
} from "@babylonjs/core";
import { type InputState }           from "../statemachines/InputState";
import type { CharacterPhysicCapsuleState, PhysicState } from "../statemachines/PhysicState";
import { type AnimationStateMachine } from "../statemachines/AnimationState";
import { playerConfig }              from "@/config/GameConfig";

const ON_GROUND_SPEED = playerConfig.speedOnGround;
const IN_AIR_SPEED = playerConfig.speedInAir;
const JUMP_HEIGHT = playerConfig.jumpHeight;
const GRAVITY = new Vector3(0, playerConfig.gravity, 0);
const ROTATE_SPEED = playerConfig.rotateSpeed;
const RUN_MULTIPLIER = playerConfig.runMultiplier;
const KNOCKBACK_FORCE = playerConfig.knockbackForce;
const ROTATE_STEP_RAD = (playerConfig.rotateStepDeg * Math.PI) / 180;
const ROTATE_ACCUMULATOR_MAX = ROTATE_STEP_RAD * 10; // evita overflow si hay lag

type CharacterState = "IN_AIR" | "ON_GROUND" | "START_JUMP";

type CharacterCapsuleHeight = Record<CharacterPhysicCapsuleState, number>; 

export class PhysicController {
  private rotAccumulator = 0;
  private controller:     PhysicsCharacterController;
  private characterMesh:  AbstractMesh;
  private raycastCapsule: Mesh;
  private startPosition:  Vector3;
  private meshOffset      = new Vector3(0, 0, 0);

  private characterCapsuleHeight: CharacterCapsuleHeight = {
    standing: playerConfig.height,
    body_to_ground: playerConfig.height / 3,
    crouch: playerConfig.height / 2
  };

  private standing_physicCapsule: PhysicsShapeCapsule;
  private crouched_physicCapsule: PhysicsShapeCapsule;

  private state:         CharacterState = "IN_AIR";
  private wantJump       = false;
  private localVelocity  = Vector3.Zero();
  private grounded       = false;

  constructor(
    private scene: Scene,  // ← agregar
    startPosition: Vector3,
    mesh: AbstractMesh | null,
    private inputState:     InputState,
    private physicState:    PhysicState,
    private animationState: AnimationStateMachine,
  ) {

    this.startPosition = startPosition.clone();
    this.createPlayerCapsules();
    this.controller = this.createController(this.startPosition, this.standing_physicCapsule);

    if (mesh) {
      this.setCharacterModel(mesh);
    }

    this.setupGameLoop(scene);

  }


  private createPlayerCapsules(): void {
    // Cápsula principal — maneja rotación y modelo
    this.characterMesh = MeshBuilder.CreateCapsule(
      "playerCapsule",
      { height: this.characterCapsuleHeight.standing, radius: playerConfig.capsuleRadius },
      this.scene
    );
    this.characterMesh.isVisible = false;
    this.characterMesh.position.copyFrom(this.startPosition);

    this.standing_physicCapsule = new PhysicsShapeCapsule(
      new Vector3(0, playerConfig.capsuleBottomPoint, 0),
      new Vector3(0, playerConfig.capsuleStandingTopPoint, 0),
      playerConfig.capsuleRadius,
      this.scene
    );

    this.crouched_physicCapsule = new PhysicsShapeCapsule(
      new Vector3(0, playerConfig.capsuleBottomPoint, 0),
      new Vector3(0, playerConfig.capsuleCrouchTopPoint, 0),
      playerConfig.capsuleRadius,
      this.scene
    );

    // Cápsula invisible para detección por raycast
    this.raycastCapsule = MeshBuilder.CreateCapsule(
      playerConfig.player1.player1RaycastDetectableName,
      { height: playerConfig.height, radius: playerConfig.capsuleRadius },
      this.scene
    );
    this.raycastCapsule.isVisible = false;
    this.raycastCapsule.isPickable = true;
    this.raycastCapsule.position.copyFrom(this.startPosition);

  }

  private createController(position: Vector3, shape: PhysicsShapeCapsule): PhysicsCharacterController {
    const newController = new PhysicsCharacterController(
      position,
      { shape },
      this.scene
    );
    const ccTransformNode = this.scene.getTransformNodeByName('CCTransformNode');
    if (ccTransformNode) {
      ccTransformNode.name = playerConfig.player1.player1CollisionDetectableName;
    }
    return newController;
  }

  // ─────────────────────────────────────────────
  //  ESTADO
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  //  VELOCIDAD DESEADA
  // ─────────────────────────────────────────────
  private getDesiredVelocity(
    dt: number,
    support: CharacterSurfaceInfo,
    currentVelocity: Vector3
  ): Vector3 {
    const nextState = this.getNextState(support);
    if (nextState !== this.state) {
      this.state = nextState;
    }

    const upWorld = GRAVITY.normalizeToNew().scaleInPlace(-1);
    const characterOrientation = this.characterMesh.rotationQuaternion
      ?? Quaternion.FromEulerAngles(0, this.characterMesh.rotation.y, 0);

    const running      = this.inputState.run === true;
    const forwardSpeed = this.inputState.moveZ;
    const speed        = this.state === "IN_AIR"
      ? IN_AIR_SPEED  * (running ? RUN_MULTIPLIER : 1)
      : ON_GROUND_SPEED * (running ? RUN_MULTIPLIER : 1);

    const backWardsSpeedMultiplicator = forwardSpeed < 0 ? 0.3 : 1;

    const desiredVelocity = new Vector3(0, 0, forwardSpeed)
      .scaleInPlace(speed)
      .scaleInPlace(backWardsSpeedMultiplicator)
      .applyRotationQuaternion(characterOrientation);

    if (this.state === "IN_AIR") {
      const outputVelocity = this.controller.calculateMovement(
        dt,
        new Vector3(0, 0, 1).applyRotationQuaternion(characterOrientation),
        upWorld,
        currentVelocity,
        Vector3.ZeroReadOnly,
        desiredVelocity,
        upWorld
      );
      outputVelocity.addInPlace(upWorld.scale(-outputVelocity.dot(upWorld)));
      outputVelocity.addInPlace(upWorld.scale(currentVelocity.dot(upWorld)));
      outputVelocity.addInPlace(GRAVITY.scale(dt));
      return outputVelocity;
    }

    if (this.state === "ON_GROUND") {
      let outputVelocity = this.controller.calculateMovement(
        dt,
        new Vector3(0, 0, 1).applyRotationQuaternion(characterOrientation),
        support.averageSurfaceNormal,
        currentVelocity,
        support.averageSurfaceVelocity,
        desiredVelocity,
        upWorld
      );

      if (forwardSpeed === 0 || this.animationState.blockingAnimationIsPlaying) {
        let slowDownFactor = 0.8;
        if (forwardSpeed === 0)                                                           slowDownFactor = 0.1;
        if (this.animationState.current === 'rolling')                                    slowDownFactor = 1;
        if (this.animationState.current === 'impact_recibed')                             slowDownFactor = 0.6;
        if (this.animationState.current === 'crunch_idle' ||
            this.animationState.current === 'crashing_flat')                              slowDownFactor = 0;

        outputVelocity = new Vector3(
          outputVelocity._x * slowDownFactor,
          outputVelocity.y,
          outputVelocity._z * slowDownFactor
        );
      }

      outputVelocity.subtractInPlace(support.averageSurfaceVelocity);
      const inv1k = 1e-3;
      if (outputVelocity.dot(upWorld) > inv1k) {
        const velLen   = outputVelocity.length();
        outputVelocity.normalizeFromLength(velLen);
        const horizLen = velLen / support.averageSurfaceNormal.dot(upWorld);
        const c        = support.averageSurfaceNormal.cross(outputVelocity);
        outputVelocity = c.cross(upWorld);
        outputVelocity.scaleInPlace(horizLen);
      }
      outputVelocity.addInPlace(support.averageSurfaceVelocity);
      return outputVelocity;
    }

    if (this.state === "START_JUMP") {
      const u          = Math.sqrt(2 * GRAVITY.length() * JUMP_HEIGHT);
      const curRelVel  = currentVelocity.dot(upWorld);
      return currentVelocity.add(upWorld.scale(u - curRelVel));
    }

    return Vector3.Zero();
  }

  // ─────────────────────────────────────────────
  //  GAME LOOP
  // ─────────────────────────────────────────────
  private setupGameLoop(scene: Scene): void {

    // Rotación del personaje
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      const turn = this.inputState.turn;

      if (turn !== 0) {
        this.characterMesh.rotationQuaternion ??= Quaternion.FromEulerAngles(
          0, this.characterMesh.rotation.y, 0
        );

    // Acumulamos tiempo de giro
    this.rotAccumulator += Math.abs(turn) * ROTATE_SPEED * dt;
    // Cap para evitar saltos grandes si hay un frame muy largo
    this.rotAccumulator = Math.min(this.rotAccumulator, ROTATE_ACCUMULATOR_MAX);

    // Aplicamos solo pasos discretos
    while (this.rotAccumulator >= ROTATE_STEP_RAD) {
      const direction = turn > 0 ? 1 : -1;
      const deltaRot = Quaternion.RotationAxis(Vector3.Up(), direction * ROTATE_STEP_RAD);
      this.characterMesh.rotationQuaternion = deltaRot.multiply(
        this.characterMesh.rotationQuaternion
      );
      this.rotAccumulator -= ROTATE_STEP_RAD;
    }
  } else {
    // Al soltar la tecla, descartamos el acumulador
    this.rotAccumulator = 0;
  }

      if (this.animationState.current === 'standing_to_crunch' && this.physicState.getCharacterPhysicCapsuleState() !== 'crouch') {
        this.standingTocrouch_updateCapsule()
      }

      if (this.animationState.current === 'crouched_to_standing' && this.physicState.getCharacterPhysicCapsuleState() !== 'standing') {
        this.crouchToStanding_updateCapsule()
      }

      // Sincronizar posición visual con el controller
      const physPos = this.controller.getPosition();
      this.characterMesh.position.copyFrom(physPos.add(this.meshOffset));
    });

    // Física
    scene.onAfterPhysicsObservable.add(() => {
      if (scene.deltaTime === undefined) return;
      const dt = scene.deltaTime / 1000;
      if (dt === 0) return;

      const down    = new Vector3(0, -1, 0);
      const support = this.controller.checkSupport(dt, down);

      this.wantJump = this.animationState.current === "jump_impulse_is_over";

      let desiredVelocity = this.getDesiredVelocity(dt, support, this.controller.getVelocity());

      // Knockback
      const { recibed_impact, impact_direction } = this.physicState.getHitData();
      if (recibed_impact) {
        const knockback = impact_direction.normalize().scale(KNOCKBACK_FORCE);
        desiredVelocity = desiredVelocity.add(knockback);
        this.physicState.clearHitImpulse();
        this.animationState.setState('impact_force_applied');
      }

      this.controller.setVelocity(desiredVelocity);
      this.controller.integrate(dt, support, GRAVITY);

      // ✅ Sincronizar raycastCapsule con el controller
      const physPos = this.controller.getPosition();
      this.raycastCapsule.position.copyFrom(physPos);

      //raycast capsule position when crouched.
      if (this.physicState.characterPhysicCapsuleState === 'crouch') {
        this.raycastCapsule.position.y = this.raycastCapsule.position.y + this.meshOffset.y/2
      }

      this.grounded = support.supportedState === CharacterSupportedState.SUPPORTED;
      this.localVelocity.copyFrom(desiredVelocity);
      this.physicState.setGrounded(this.grounded);
      this.physicState.setVelocity(desiredVelocity);
      this.physicState.setPosition(this.characterMesh.getAbsolutePosition());
      this.physicState.setForward(this.characterMesh.forward);
    });
  }


  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  setCharacterModel(mesh: AbstractMesh): void {
    mesh.position.copyFrom(this.startPosition.add(this.meshOffset));
    mesh.rotation.copyFrom(this.characterMesh.rotation);
    mesh.scaling.copyFrom(this.characterMesh.scaling);
    this.characterMesh.dispose();
    this.characterMesh      = mesh;
    this.characterMesh.name = playerConfig.player1.positionTrackeableMeshName;
    this.controller.setPosition(mesh.position.clone());
  }

  setMeshYOffset(y: number): void {
    this.meshOffset.y = y;
  }

  get targetMesh(): AbstractMesh  { return this.characterMesh; }
  get position():   Vector3       { return this.characterMesh.position; }
  get isGrounded(): boolean       { return this.grounded; }
  get velocity():   Vector3       { return this.localVelocity; }
  get speed():      number {
    return new Vector3(this.localVelocity.x, 0, this.localVelocity.z).length();
  }


  public standingTocrouch_updateCapsule(): void {
    this.physicState.setCharacterPhysicCapsuleState('crouch');
    const pos = this.controller.getPosition();
    const vel = this.controller.getVelocity();
    this.controller.dispose();
    this.controller = this.createController(pos, this.crouched_physicCapsule);
    this.controller.setVelocity(vel);
    this.raycastCapsule.scaling._y = 0.4
  }

  public crouchToStanding_updateCapsule(): void {
    this.physicState.setCharacterPhysicCapsuleState('standing');
    const pos = this.controller.getPosition();
    const vel = this.controller.getVelocity();
    this.controller.dispose();
    this.controller = this.createController(pos, this.standing_physicCapsule);
    this.controller.setVelocity(vel);
    this.raycastCapsule.scaling._y = 1
  }

  dispose(): void {
    this.characterMesh.dispose();
    this.raycastCapsule.dispose();
  }
}