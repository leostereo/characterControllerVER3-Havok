import { FollowCamera, Vector3, type Scene, type AbstractMesh, type KeyboardInfo, type ArcRotateCamera } from "@babylonjs/core";

export class CameraController {
  private readonly camera: FollowCamera;

  constructor(scene: Scene, targetMesh:AbstractMesh) {
    this.camera = new FollowCamera('FollowCam', new Vector3(0, 10, 0), scene);
    this.camera.radius = 10;

    // The goal height of camera above local oriin (centre) of target
    this.camera.heightOffset = 5;

    // The goal rotation of camera around local origin (centre) of target in x y plane
    this.camera.rotationOffset = 180;

    //Acceleration of camera in moving from current to goal position
    this.camera.cameraAcceleration = 0.05

    //The speed at which acceleration is halted 
    this.camera.maxCameraSpeed = 10

    this.camera.lockedTarget = targetMesh;

    scene.activeCamera = this.camera;


    this.camera.attachControl(true);

    scene.onKeyboardObservable.add((kbInfo: KeyboardInfo) => this.onDebugKeyboard(kbInfo, scene))

  }

  
  private onDebugKeyboard(kbInfo: KeyboardInfo, scene: Scene):void {

    const camera = scene.getCameraByName('camera') as ArcRotateCamera;
    
    switch (kbInfo.event.key) {
      case '1':
        // console.log(this.State.state, this.displayMeshAggregate.body.getLinearVelocity()._y, this.AnimationContainer.getCurrentPlayingAnimation()?.name)
        break;

      case '2':
        // console.log(this.AnimationContainer.getLatchedAnimation())
        break;

      case '3':
        camera.alpha = Math.PI / 2
        camera.beta = Math.PI / 2
        camera.radius = 10;
        scene.activeCamera = camera;
        break;
      case '4':
        camera.alpha = -Math.PI / 2
        camera.beta = Math.PI / 2
        camera.radius = 10;
        scene.activeCamera = camera;
        break;
      case '5':
        camera.alpha = 0
        camera.beta = Math.PI / 2
        camera.radius = 30;
        scene.activeCamera = camera;
        break;
      case '6':
        camera.alpha = 0
        camera.beta = 0
        camera.radius = 150;
        scene.activeCamera = camera;
        break;
      case '7':
        const originalCamera = scene.getCameraByName('FollowCam') as ArcRotateCamera;
        scene.activeCamera = originalCamera;
        break;
    }

  }
}