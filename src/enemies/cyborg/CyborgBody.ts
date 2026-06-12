// src/enemies/cyborgV1/CyborgBody.ts

import {
  type Scene,
  type AbstractMesh,
  type AnimationGroup,
  type TransformNode,
  type Vector3,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import {  type ICyborgStateMachine } from "../interfaces/ICyborgStateMachine";


// ─────────────────────────────────────────────
//  TIPOS
// ─────────────────────────────────────────────
export interface CyborgAnimations {
  idle: AnimationGroup;
  walking_patrol: AnimationGroup;
  running_alert: AnimationGroup;
  aiming: AnimationGroup;
  hit_reaction: AnimationGroup;
  defeated: AnimationGroup;
  look_around: AnimationGroup;
}

export class CyborgBody {

  private rootNode: TransformNode;
  private animations: CyborgAnimations | null = null;
  private currentAnimation: AnimationGroup | null = null;

  constructor(
    private scene: Scene,
    private fsm: ICyborgStateMachine,
    private rootMesh: AbstractMesh,
    animationGroups: AnimationGroup[],
    private uniqueId: string,
  ) {
    this.rootNode = rootMesh;   // ← sin TransformNode extra

    //this.setupMeshes();
    this.setupAnimations(animationGroups);
    this.subscribeToFSM();
  }

  // ─────────────────────────────────────────────
  //  SETUP
  // ─────────────────────────────────────────────
  private setupMeshes(): void {
    // centrar y reparentar todos los meshes al rootNode
    // definir scale para tamaño.
    // corregir offset en y
    // definir raycast y collision detectables.
    // verifcar el forward
    this.rootMesh.parent = this.rootNode;

    this.rootMesh.getChildMeshes().forEach(mesh => {
      const mat = new StandardMaterial(`cyborg_mat_${mesh.name}`, this.scene);
      mat.diffuseColor = new Color3(0.2, 0.3, 0.4);   // ← azul grisáceo
      mat.emissiveColor = new Color3(0.0, 0.1, 0.2);   // ← emissive muy suave
      mat.specularColor = new Color3(0.3, 0.3, 0.3);
      mesh.material = mat;
    });
  }

  private setupAnimations(groups: AnimationGroup[]): void {
    const find = (name: string): AnimationGroup | undefined =>
      groups.find(g => g.name === `${name}_${this.uniqueId}`);

    const idle = find("idle");
    const walking_patrol = find("walking");
    const running_alert = find("alert running");
    const aiming = find("aiming");
    const hit_reaction = find("hit reaction");
    const defeated = find("death back");
    const look_around = find("look around");

    if (!idle || !walking_patrol || !running_alert ||
      !aiming || !hit_reaction || !defeated || !look_around) {
      console.warn("[CyborgBody] Faltan animaciones:", {
        idle, walking_patrol, running_alert,
        aiming, hit_reaction, defeated, look_around
      });
      return;
    }

    this.animations = {
      idle,
      walking_patrol,
      running_alert,
      aiming,
      hit_reaction,
      defeated,
      look_around,
    };

    groups.forEach(g => g.stop());
  }

  private subscribeToFSM(): void {
    this.fsm.onStateChange((state) => {
      this.onStateChanged(state);
    });
  }

  // ─────────────────────────────────────────────
  //  REACCIÓN A CAMBIOS DE ESTADO
  // ─────────────────────────────────────────────
  private onStateChanged(state: ReturnType<ICyborgStateMachine["getState"]>): void {
    if (!this.animations) return;

    switch (state) {
      case "patrolling":
        this.playLoop(this.animations.walking_patrol);
        break;

      case "shooting":
        this.playLoop(this.animations.aiming);
        break;

      case "searching":
        this.playLoop(this.animations.running_alert);
        break;

      case "intensiveSearch":
        this.playLoop(this.animations.running_alert);
        break;

      case "paused":
        this.playLoop(this.animations.idle);
        break;

      case "hit_reaction":
        this.playOnce(this.animations.hit_reaction, () => {
          this.fsm.onHitReactionEnded();
        });
        break;

      case "defeated":
        this.playOnce(this.animations.defeated, () => {
          this.fsm.onDefeatedAnimationEnded();
        });
        break;
    }
  }

  // ─────────────────────────────────────────────
  //  REPRODUCCIÓN DE ANIMACIONES
  // ─────────────────────────────────────────────
  private playLoop(animation: AnimationGroup): void {
    if (this.currentAnimation === animation) return;
    this.currentAnimation?.stop();
    this.currentAnimation = animation;
    animation.play(true);  // ← loop
  }

  private playOnce(animation: AnimationGroup, onEnd: () => void): void {
    this.currentAnimation?.stop();
    this.currentAnimation = animation;
    animation.play(false);  // ← sin loop

    // suscribir al final de la animación
    animation.onAnimationGroupEndObservable.addOnce(() => {
      onEnd();
    });
  }

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  getRootNode(): TransformNode { return this.rootNode; }

  getPosition(): Vector3 {
    return this.rootNode.getAbsolutePosition();
  }

  setPosition(position: Vector3): void {
    this.rootNode.position = position.clone();
  }

  dispose(): void {
    this.currentAnimation?.stop();
    this.animations = null;
    this.rootNode.dispose();
  }
}