import { InputController } from "./controllers/InputController";
import { PhysicController } from "./controllers/PhysicController";
import { AnimationController } from "./controllers/AnimationController";
import { type InputState } from "./statemachines/InputState";
import { PhysicState } from "./statemachines/PhysicState";
import { AnimationStateMachine } from "./statemachines/AnimationState";
import type { Scene, Vector3, AbstractMesh, AnimationGroup, Observer } from "@babylonjs/core";
import { CameraController } from "./controllers/CameraController";
import { AnimationGroupsManager } from "./managers/AnimationGroupsManger";
import { ThrowController } from "./controllers/ThrowController";
import { type CommandDispatcher } from "@/input/CommandDispatcher";
import { GamepadController } from "./controllers/GamepadController";

export class Player {
  //state
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
    meshYOffset = 0,
    inputState: InputState,        // ← nuevo
    dispatcher: CommandDispatcher, // ← nuevo
  ) {
    this.inputController = new InputController(dispatcher, this.animationState);
    new GamepadController(dispatcher, this.animationState)
    this.physicController = new PhysicController(scene, startPosition, mesh, inputState, this.physicState, this.animationState);
    this.animationGroupsManager = new AnimationGroupsManager(animationGroups, this.animationState);
    this.animationController = new AnimationController(
      inputState,
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

  public setPlayerGameOver(): void {
    this.scene.onBeforeRenderObservable.remove(this.renderObserver);
    this.scene.animationGroups.forEach((ag) => ag.stop())
    this.animationController.gameOver();
  }
}