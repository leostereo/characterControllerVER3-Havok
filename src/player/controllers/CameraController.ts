import { cameraConfig } from "@/config/GameConfig";
import { ArcRotateCamera, FollowCamera, Vector3, type Scene, type AbstractMesh, type KeyboardInfo, HemisphericLight } from "@babylonjs/core";

export class CameraController {
  private followCamera: FollowCamera;
  private arcRotateCamera: ArcRotateCamera;

  constructor(scene: Scene, targetMesh: AbstractMesh) {

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.5;
    scene.onKeyboardObservable.add((kbInfo: KeyboardInfo) => this.onDebugKeyboard(kbInfo, scene))
    this.init_followCamera(scene, targetMesh);
    this.init_arcRotateCamera(scene);

  }

  private init_followCamera(scene: Scene, targetMesh: AbstractMesh): void {
    this.followCamera = new FollowCamera('FollowCam', new Vector3(0, 10, 0), scene);
    this.followCamera.radius = cameraConfig.followCamera.radius;
    // The goal height of camera above local oriin (centre) of target
    this.followCamera.heightOffset = cameraConfig.followCamera.heightOffset;
    // The goal rotation of camera around local origin (centre) of target in x y plane
    this.followCamera.rotationOffset = cameraConfig.followCamera.rotationOffset;
    //Acceleration of camera in moving from current to goal position
    this.followCamera.cameraAcceleration = cameraConfig.followCamera.cameraAcceleration;
    //The speed at which acceleration is halted 
    this.followCamera.maxCameraSpeed = cameraConfig.followCamera.maxCameraSpeed;
    this.followCamera.lockedTarget = targetMesh;
    scene.activeCamera = this.followCamera;
    // this.followCamera.attachControl(true);

  }

  private init_arcRotateCamera(scene: Scene): void {
    this.arcRotateCamera = new ArcRotateCamera(
      'arcRotateCamera', 0, 0, 120, Vector3.Zero(), scene)
  } 



  private onDebugKeyboard(kbInfo: KeyboardInfo, scene: Scene): void {

    switch (kbInfo.event.key) {
      case '1':
        scene.activeCamera = this.followCamera;
        break;

      case '2':
        scene.activeCamera = this.arcRotateCamera;
        break;
    }

  }
}