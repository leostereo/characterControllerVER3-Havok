import {
  type Scene,
  type AbstractMesh,
  type AnimationGroup,
  type Vector3,
  type Mesh,
  PhysicsAggregate,
  PhysicsShapeType,
  PhysicsMotionType,
  MeshBuilder,
} from "@babylonjs/core";
import { meshMetadata, type MeshMetadata } from "@/config/GameConfig";
import type { ICyborgStateMachine } from "../interfaces/ICyborgStateMachine";


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

  private currentAnimation: AnimationGroup | null = null;
  private animations: CyborgAnimations | null = null;
  private physicsAggregate: PhysicsAggregate | null = null;
  private colliderMesh: Mesh | null = null;

  constructor(
    private scene: Scene,
    private fsm: ICyborgStateMachine,
    private rootMesh: AbstractMesh,
    animationGroups: AnimationGroup[],
    private uniqueId: string,
  ) {
    this.setupMeshes();
    this.setupPhysics();
    this.setupAnimations(animationGroups);
    this.subscribeToFSM();
  }

  // ─────────────────────────────────────────────
  //  SETUP
  // ─────────────────────────────────────────────
  private setupMeshes(): void {
    const cyborgMetadata: MeshMetadata = {
      type: meshMetadata.types.enemy,
      enemyClass: meshMetadata.enemyClasses.cyborg,
      stationId: this.uniqueId,
    };

    // aplicar metadata y material a todos los child meshes
    this.rootMesh.getChildMeshes().forEach(mesh => {
      mesh.metadata = cyborgMetadata;
    });
  }

  private setupPhysics(): void {
    // crear un mesh invisible para la física
    const capsule = MeshBuilder.CreateCapsule(
      `cyborg_collider_${this.uniqueId}`,
      {
        height: 1.8,
        radius: 0.3,
        tessellation: 8,
      },
      this.scene
    );

    capsule.position = this.rootMesh.getAbsolutePosition().clone();
    capsule.position.y += 0.9;  // ← centrar verticalmente
    capsule.isVisible = false;
    capsule.isPickable = true;
    capsule.metadata = {
      type: meshMetadata.types.enemy,
      enemyClass: meshMetadata.enemyClasses.cyborg,
      stationId: this.uniqueId,
    };

    this.physicsAggregate = new PhysicsAggregate(
      capsule,
      PhysicsShapeType.CAPSULE,
      { mass: 0, restitution: 0.1, friction: 0.9 },
      this.scene
    );

    this.physicsAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
    this.physicsAggregate.body.disablePreStep = false;

    this.colliderMesh = capsule;  // ← guardar referencia para mover en update
  }
  // ─────────────────────────────────────────────
  //  ANIMACIONES
  // ─────────────────────────────────────────────
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
      console.warn("[CyborgBody] Faltan animaciones");
      return;
    }

    hit_reaction.from = 40;
    hit_reaction.to = 100;
    defeated.from = 15;

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
    this.fsm.onStateChange((state) => this.onStateChanged(state));
  }

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
        this.playLoop(this.animations.look_around);
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

  private playLoop(animation: AnimationGroup): void {
    if (this.currentAnimation === animation) return;
    this.currentAnimation?.stop();
    this.currentAnimation = animation;
    animation.play(true);
  }

  private playOnce(animation: AnimationGroup, onEnd: () => void): void {
    this.currentAnimation?.stop();
    this.currentAnimation = animation;
    animation.play(false);
    animation.onAnimationGroupEndObservable.addOnce(() => onEnd());
  }

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  getPosition(): Vector3 {
    return this.rootMesh.getAbsolutePosition();
  }

  setPosition(position: Vector3): void {
    this.rootMesh.position = position.clone();

    if (this.colliderMesh) {
      this.colliderMesh.position.x = position.x;
      this.colliderMesh.position.y = position.y + 0.9;  // ← offset vertical
      this.colliderMesh.position.z = position.z;
    }
  }

  getColliderMesh(): Mesh | null { return this.colliderMesh; }

  syncCollider(): void {
    if (!this.colliderMesh) return;
    this.colliderMesh.position.x = this.rootMesh.position.x;
    this.colliderMesh.position.z = this.rootMesh.position.z;
  }

  dispose(): void {
    this.currentAnimation?.stop();
    this.physicsAggregate?.dispose();
    this.animations = null;
    this.rootMesh.dispose();
  }
}