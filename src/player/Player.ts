import { InputController } from "./controllers/InputController";
import { PhysicController } from "./controllers/PhysicController";
import { AnimationController } from "./controllers/AnimationController";
import { InputState } from "./statemachines/InputState";
import { PhysicState } from "./statemachines/PhysicState";
import { AnimationStateMachine } from "./statemachines/AnimationState";
import type { Scene, Vector3, AbstractMesh, AnimationGroup, Texture } from "@babylonjs/core";
import { CameraController } from "./controllers/CameraController";
import { AnimationGroupsManager } from "./managers/AnimationGroupsManger";
import { ThrowController } from "./controllers/ThrowController";
import { ParticlesManager } from "./managers/ParticlesManager";

export class Player {
  //state
  private inputState = new InputState();
  private physicState = new PhysicState();
  private animationState = new AnimationStateMachine();

  //managers
  private animationGroupsManager: AnimationGroupsManager;
  private particlesManager: ParticlesManager;

  //controlllers
  private inputController = new InputController(this.inputState);
  private physicController: PhysicController;
  private animationController: AnimationController;
  private throwController: ThrowController;
  private cameraController: CameraController;

  constructor(
    scene: Scene,
    startPosition: Vector3,
    mesh: AbstractMesh,
    animationGroups: AnimationGroup[] = [],
    particlesEmiterTexture:Texture,
    meshYOffset = 0
  ) {
    this.particlesManager = new ParticlesManager(scene, particlesEmiterTexture)
    this.physicController = new PhysicController(scene, startPosition, mesh, this.inputState, this.physicState, this.animationState);
    this.animationGroupsManager = new AnimationGroupsManager(animationGroups, this.animationState);
    this.animationController = new AnimationController(
      this.inputState,
      this.physicState,
      this.animationState,
      this.animationGroupsManager  // Cambiado
    );

    this.throwController = new ThrowController(
      scene,
      this.physicState,
      this.animationState,
      this.particlesManager
    );

    if (meshYOffset !== 0) {
      this.physicController.setMeshYOffset(meshYOffset);
    }

    this.cameraController = new CameraController(scene, mesh);
    this.startUpdateLoop(scene);

  }

  startUpdateLoop(scene: Scene): void {
    scene.onBeforeRenderObservable.add(() => {
      this.throwController.update();  //alwais before animationController.update()
      this.animationController.update();
    });
  }

}