import { InputController } from "./controllers/InputController";
import { PhysicController } from "./controllers/PhysicController";
import { AnimationController } from "./controllers/AnimationController";
import { InputState } from "./statemachines/InputState";
import { PhysicState } from "./statemachines/PhysicState";
import { AnimationStateMachine } from "./statemachines/AnimationState";
import type { Scene, Vector3, AbstractMesh, AnimationGroup } from "@babylonjs/core";
import { CameraController } from "./controllers/CameraController";

export class Player {
  private inputState = new InputState();
  private physicState = new PhysicState();
  private animationState = new AnimationStateMachine();

  private inputController = new InputController(this.inputState);
  private physicController: PhysicController;
  private animationController: AnimationController;
  private cameraController: CameraController;

  constructor(
    scene: Scene,
    startPosition: Vector3,
    mesh: AbstractMesh,
    animationGroups: AnimationGroup[] = [],
    meshYOffset = 0
  ) {
    this.physicController = new PhysicController(scene, startPosition, mesh, this.inputState, this.physicState);
    this.animationController = new AnimationController(this.inputState, this.physicState, this.animationState, animationGroups);

    if (meshYOffset !== 0) {
      this.physicController.setMeshYOffset(meshYOffset);
    }

    this.cameraController = new CameraController(scene,mesh);


    this.startUpdateLoop(scene);
  }

  update(): void {
    this.animationController.update();
  }

  startUpdateLoop(scene: Scene): void {
    scene.onBeforeRenderObservable.add(() => {
      this.animationController.update();
    });
  }

}