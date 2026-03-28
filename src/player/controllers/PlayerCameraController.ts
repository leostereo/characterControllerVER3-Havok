import { FollowCamera, Vector3, type Scene, type AbstractMesh } from "@babylonjs/core";

export class PlayerCameraController {
  private readonly camera: FollowCamera;

  constructor(scene: Scene) {
    this.camera = new FollowCamera('FollowCam', new Vector3(0, 10, 0), scene);
    this.camera.radius = 15;

    // The goal height of camera above local oriin (centre) of target
    this.camera.heightOffset = 5;

    // The goal rotation of camera around local origin (centre) of target in x y plane
    this.camera.rotationOffset = 180;

    //Acceleration of camera in moving from current to goal position
    this.camera.cameraAcceleration = 0.005

    //The speed at which acceleration is halted 
    this.camera.maxCameraSpeed = 10

    scene.activeCamera = this.camera;
    this.camera.attachControl(true);
  }

  public setTarget(mesh: AbstractMesh): void {
    this.camera.lockedTarget = mesh;
  }
}