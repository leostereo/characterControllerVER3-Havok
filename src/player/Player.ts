import { InputController } from "./controllers/InputController";
import { PhysicController } from "./controllers/PhysicController";
import { AnimationController } from "./controllers/AnimationController";
import { InputState } from "./statemachines/InputState";
import { PhysicState } from "./statemachines/PhysicState";
import { AnimationStateMachine } from "./statemachines/AnimationState";
import type { Scene, Vector3, AbstractMesh, AnimationGroup, Observer } from "@babylonjs/core";
import { CameraController } from "./controllers/CameraController";
import { AnimationGroupsManager } from "./managers/AnimationGroupsManger";
import { ThrowController } from "./controllers/ThrowController";

export class Player {
  //state
  private inputState = new InputState();
  private physicState = new PhysicState();
  private animationState = new AnimationStateMachine();

  //managers
  private animationGroupsManager: AnimationGroupsManager;

  //controlllers
  private inputController: InputController;
  private physicController: PhysicController;
  private animationController: AnimationController;
  private throwController: ThrowController;
  private cameraController: CameraController;
  private renderObserver: Observer<Scene> | null = null;

  constructor(
    private scene: Scene,
    startPosition: Vector3,
    mesh: AbstractMesh,
    animationGroups: AnimationGroup[] = [],
    meshYOffset = 0
  ) {
      this.inputController = new InputController(this.inputState, this.animationState);
      // this.particlesManager = new ParticlesManager(scene, particlesEmiterTexture)
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
    );

    if (meshYOffset !== 0) {
      this.physicController.setMeshYOffset(meshYOffset);
    }

    this.cameraController = new CameraController(scene, mesh);
    this.startUpdateLoop(scene);

  }

  public dispatch(): void {
    this.physicController.dispose();
    this.throwController.dispose();
    this.scene.onBeforeRenderObservable.remove(this.renderObserver);
  }

  startUpdateLoop(scene: Scene): void {
    this.renderObserver = scene.onBeforeRenderObservable.add(() => {
      this.throwController.update();
      this.animationController.update();
    });
  }

  public setPlayerGameOver() {
    this.scene.onBeforeRenderObservable.remove(this.renderObserver);
    this.scene.animationGroups.forEach((ag) => ag.stop())
    this.animationController.gameOver();
  }
}