import { cameraConfig } from "@/config/GameConfig";
import { FollowCamera, Vector3, type Scene, type AbstractMesh, type KeyboardInfo, type ArcRotateCamera } from "@babylonjs/core";

export class CameraController {
  private readonly camera: FollowCamera;

  constructor(scene: Scene, targetMesh: AbstractMesh) {
    this.camera = new FollowCamera('FollowCam', new Vector3(0, 10, 0), scene);
    this.camera.radius = cameraConfig.followCamera.radius;

    // The goal height of camera above local oriin (centre) of target
    this.camera.heightOffset = cameraConfig.followCamera.heightOffset;

    // The goal rotation of camera around local origin (centre) of target in x y plane
    this.camera.rotationOffset = cameraConfig.followCamera.rotationOffset;

    //Acceleration of camera in moving from current to goal position
    this.camera.cameraAcceleration = cameraConfig.followCamera.cameraAcceleration;

    //The speed at which acceleration is halted 
    this.camera.maxCameraSpeed = cameraConfig.followCamera.maxCameraSpeed;

    this.camera.lockedTarget = targetMesh;

    scene.activeCamera = this.camera;

    this.camera.attachControl(true);

    scene.onKeyboardObservable.add((kbInfo: KeyboardInfo) => this.onDebugKeyboard(kbInfo, scene))

  }


  private onDebugKeyboard(kbInfo: KeyboardInfo, scene: Scene): void {

    const camera = scene.getCameraByName('camera') as ArcRotateCamera;

    switch (kbInfo.event.key) {
      case '1':
        scene.activeCamera = this.camera;
        this.camera.heightOffset = cameraConfig.followCamera.heightOffset;
        this.camera.rotationOffset = cameraConfig.followCamera.rotationOffset;
        this.camera.cameraAcceleration = cameraConfig.followCamera.cameraAcceleration;
        this.camera.maxCameraSpeed = cameraConfig.followCamera.maxCameraSpeed;

        break;

      case '2':
        camera.alpha = 0
        camera.beta = 0
        camera.radius = 100;
        scene.activeCamera = camera;
        break;
    }

  }
}