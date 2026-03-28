import type { Scene, AbstractMesh, AnimationGroup, Vector3 } from "@babylonjs/core";
import { PlayerController } from "./controllers/PlayerController";
import { PlayerAnimationController } from "./controllers/PlayerAnimationController";
import { PlayerCameraController } from "./controllers/PlayerCameraController";
import { PlayerEffectsController } from "./controllers/PlayerEffectsController";

export class Player {
  private controller: PlayerController;
  private animationController: PlayerAnimationController;
  private cameraController: PlayerCameraController;
  private effectsController: PlayerEffectsController;

  constructor(scene: Scene, startPosition: Vector3) {
    this.controller = new PlayerController(scene, startPosition);
    this.animationController = new PlayerAnimationController(this.controller);
    this.cameraController = new PlayerCameraController(scene, this.controller);
    this.effectsController = new PlayerEffectsController(this.controller);
  }

  /**
   * Establece el modelo del personaje con sus animaciones.
   */
  setCharacterModel(mesh: AbstractMesh, animationGroups: AnimationGroup[]): void {
    // Detener todas las animaciones en play
    animationGroups.forEach((group) => {
      if (group.isPlaying) {
        group.stop();
      }
    });

    // Pasar el mesh al controller
    this.controller.setCharacterModel(mesh);

    // Pasar las animaciones solo a PlayerAnimationController
    this.animationController.setAnimationGroups(animationGroups);
  }

  /**
   * Establece el offset Y del mesh si es necesario.
   */
  setMeshYOffset(y: number): void {
    this.controller.setMeshYOffset(y);
  }

  /**
   * Inicia el loop de actualización de todos los controllers.
   */
  startUpdateLoop(scene: Scene): void {
    scene.onBeforeRenderObservable.add(() => {
      this.animationController.update();
      this.effectsController.update();
    });
  }

  /**
   * Obtiene el controller de movimiento (para acceso directo si es necesario).
   */
  getController(): PlayerController {
    return this.controller;
  }

  /**
   * Obtiene el controller de animación.
   */
  getAnimationController(): PlayerAnimationController {
    return this.animationController;
  }

  /**
   * Obtiene el controller de cámara.
   */
  getCameraController(): PlayerCameraController {
    return this.cameraController;
  }

  /**
   * Obtiene el controller de efectos.
   */
  getEffectsController(): PlayerEffectsController {
    return this.effectsController;
  }

  /**
   * Libera recursos.
   */
  dispose(): void {
    this.controller.dispose();
  }
}