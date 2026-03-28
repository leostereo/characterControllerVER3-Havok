import { FollowCamera, Vector3, Scene } from "@babylonjs/core";
import { PlayerController } from "./PlayerController";

export class PlayerCameraController {
  private readonly camera: FollowCamera;

  constructor(scene: Scene, player: PlayerController) {
    this.camera = new FollowCamera("playerCam", player.position.add(new Vector3(0, 2, -6)), scene);
    this.camera.lockedTarget = player.targetMesh;
    this.camera.radius = 6;
    this.camera.heightOffset = 2;
    this.camera.rotationOffset = 180;
    this.camera.cameraAcceleration = 0.05;
    this.camera.maxCameraSpeed = 20;

    scene.activeCamera = this.camera;
    this.camera.attachControl(true);
  }
}