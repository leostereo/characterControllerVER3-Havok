import {
  type Scene,
  Vector3,
  MeshBuilder,
  type AbstractMesh,
  PhysicsCharacterController,
  CharacterSupportedState,
  type CharacterSurfaceInfo,
  Quaternion,
} from "@babylonjs/core";
import { type InputState } from "../statemachines/InputState";
import { type PhysicState } from "../statemachines/PhysicState";
import { type AnimationStateMachine } from "../statemachines/AnimationState";

const ON_GROUND_SPEED = 10.0;
const IN_AIR_SPEED = 8.0;
const JUMP_HEIGHT = 3.5;
const GRAVITY = new Vector3(0, -18, 0);
const ROTATE_SPEED = 2;
const RUN_MULTIPLIER = 1.8;

type CharacterState = "IN_AIR" | "ON_GROUND" | "START_JUMP";

export class PhysicController {
  private controller: PhysicsCharacterController;
  private characterMesh: AbstractMesh;
  private startPosition: Vector3;
  private meshOffset = new Vector3(0, 0, 0);

  private state: CharacterState = "IN_AIR";
  private wantJump = false;

  private localVelocity = Vector3.Zero();
  private grounded = false;

  constructor(
    scene: Scene,
    startPosition: Vector3,
    mesh: AbstractMesh | null,
    private inputState: InputState,
    private physicState: PhysicState,
    private animationState: AnimationStateMachine,
  ) {
    this.startPosition = startPosition.clone();

    this.characterMesh = MeshBuilder.CreateCapsule(
      "playerCapsule",
      { height: 1.8, radius: 0.4 },
      scene
    );
    this.characterMesh.position.copyFrom(this.startPosition);

    this.controller = new PhysicsCharacterController(
      this.startPosition,
      { capsuleHeight: 1.8, capsuleRadius: 0.4 },
      scene
    );

    if (mesh) {
      this.setCharacterModel(mesh);
    }

    this.setupGameLoop(scene);
  }

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
    const nextState = this.getNextState(support);
    if (nextState !== this.state) {
      this.state = nextState;
    }

    const upWorld = GRAVITY.normalizeToNew().scaleInPlace(-1);
    const characterOrientation = this.characterMesh.rotationQuaternion
      ?? Quaternion.FromEulerAngles(0, this.characterMesh.rotation.y, 0);

    const running = this.inputState.run === true;
    const forwardSpeed = this.inputState.moveZ;
    const speed = this.state === "IN_AIR"
      ? IN_AIR_SPEED * (running ? RUN_MULTIPLIER : 1)
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

      // Will force character to slowdown on particular situations
      if (forwardSpeed === 0 || this.animationState.blockingAnimationIsPlaying) {
        //will priorize when no input forward detected
        let slowDownFactor =  forwardSpeed === 0 ?  0.1 : 0.8
        slowDownFactor = this.animationState.current === 'ducking' ? 0 : slowDownFactor;
        slowDownFactor = this.animationState.current === 'rolling' ? 1 : slowDownFactor;
        const scaledx =   outputVelocity._x*slowDownFactor; 
        const scaledz =   outputVelocity._z*slowDownFactor; 
        outputVelocity = new Vector3(scaledx,outputVelocity.y,scaledz)
      }

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
    }

    if (this.state === "START_JUMP") {
      const u = Math.sqrt(2 * GRAVITY.length() * JUMP_HEIGHT);
      const curRelVel = currentVelocity.dot(upWorld);
      return currentVelocity.add(upWorld.scale(u - curRelVel));
    }

    return Vector3.Zero();
  }

  private setupGameLoop(scene: Scene): void {
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      const turn = this.inputState.turn;
      if (turn !== 0) {
        this.characterMesh.rotationQuaternion ??= Quaternion.FromEulerAngles(
          0,
          this.characterMesh.rotation.y,
          0
        );
        const deltaRot = Quaternion.RotationAxis(Vector3.Up(), turn * ROTATE_SPEED * dt);
        this.characterMesh.rotationQuaternion = deltaRot.multiply(
          this.characterMesh.rotationQuaternion
        );
      }

      const physPos = this.controller.getPosition();
      this.characterMesh.position.copyFrom(physPos.add(this.meshOffset));
    });

    scene.onAfterPhysicsObservable.add(() => {
      if (scene.deltaTime === undefined) return;
      const dt = scene.deltaTime / 1000;
      if (dt === 0) return;

      const down = new Vector3(0, -1, 0);
      const support = this.controller.checkSupport(dt, down);

      // this.wantJump = this.inputState.action === "jump";
      this.wantJump = this.animationState.current === "jump_impulse_is_over"

      const desiredVelocity = this.getDesiredVelocity(dt, support, this.controller.getVelocity());
      this.controller.setVelocity(desiredVelocity);
      this.controller.integrate(dt, support, GRAVITY);

      this.grounded = support.supportedState === CharacterSupportedState.SUPPORTED;
      this.localVelocity.copyFrom(desiredVelocity);
      this.physicState.setGrounded(this.grounded);
      this.physicState.setVelocity(desiredVelocity);
      this.physicState.setPosition(this.characterMesh.getAbsolutePosition());
      this.physicState.setForward(this.characterMesh.forward)
      
    });
  }

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
  }

  get targetMesh(): AbstractMesh { return this.characterMesh; }
  get position(): Vector3 { return this.characterMesh.position; }
  get isGrounded(): boolean { return this.grounded; }
  get velocity(): Vector3 { return this.localVelocity; }
  get speed(): number {
    return new Vector3(this.localVelocity.x, 0, this.localVelocity.z).length();
  }

  dispose(): void {
    this.characterMesh.dispose();
  }
}