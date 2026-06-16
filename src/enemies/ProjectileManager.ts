// src/enemies/ProjectileManager.ts

import { playerConfig, projectilesConfig } from "@/config/GameConfig";
import { EventManager }                    from "@/game/eventManager/eventManager";
import { ProjectileMeshFactory, type ProjectileType, type ProjectileMeshOptions } from "./projectiles/ProjectileMeshFactory";
import {
  type Scene,
  type Mesh,
  type Color3,
  type Vector3,
  PhysicsAggregate,
  PhysicsShapeType,
  type Observer,
  type IPhysicsCollisionEvent,
} from "@babylonjs/core";

export interface ProjectileOptions {
  speed:       number;
  radius:      number;
  height?:     number;
  maxLifetime: number;
  color?: {
    diffuse:  Color3;
    emissive: Color3;
  };
}

const DEFAULT_OPTIONS: ProjectileOptions = {
  speed:       projectilesConfig.canion.speed_2,
  radius:      projectilesConfig.canion.radius,
  maxLifetime: projectilesConfig.canion.maxLifetime,
};

export class ProjectileManager {

  private eventManager = EventManager.getInstance();

  constructor(
    private scene:   Scene,
    private type:    ProjectileType = "sphere",
    private options: Partial<ProjectileOptions> = {}
  ) {}

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  throwProjectile(origin: Vector3, direction: Vector3, speed?: number): void {
    const opts = { ...DEFAULT_OPTIONS, ...this.options };
    if (speed) opts.speed = speed;

    const meshOptions: ProjectileMeshOptions = {
      radius:  opts.radius,
      height:  opts.height,
      color:   opts.color,
      direction: direction,   // ← nuevo
    };

    const mesh      = ProjectileMeshFactory.create(this.type, this.scene, meshOptions);
    mesh.position   = origin.clone();

    const aggregate = new PhysicsAggregate(
      mesh,
      PhysicsShapeType.BOX,
      { mass: 5, restitution: 0.0, friction: 0.0 },
      this.scene
    );

    const impulse = direction.scale(opts.speed);
    aggregate.body.applyImpulse(impulse, mesh.getAbsolutePosition());

    aggregate.body.setCollisionCallbackEnabled(true);
    const collisionObserver = aggregate.body.getCollisionObservable().add((event) => {
      const hitMesh = event.collidedAgainst?.transformNode as Mesh;
      if (hitMesh?.name !== playerConfig.player1.player1CollisionDetectableName) return;
      this.onImpact(direction, hitMesh, mesh, aggregate, collisionObserver);
    });

    setTimeout(() => this.destroy(mesh, aggregate, collisionObserver), opts.maxLifetime);
  }

  // ─────────────────────────────────────────────
  //  IMPACTO
  // ─────────────────────────────────────────────
  private onImpact(
    direction:         Vector3,
    hitMesh:           Mesh | null,
    projectileMesh:    Mesh,
    aggregate:         PhysicsAggregate,
    collisionObserver: Observer<IPhysicsCollisionEvent>
  ): void {
    if (projectileMesh.isDisposed()) return;

    this.eventManager.emit({
      type:       "projectile_hit",
      source:     "enemy",
      sourceType: "enemy",
      data: {
        direction:   direction.clone(),
        hitMeshName: hitMesh?.name ?? "unknown",
      }
    });

    this.destroy(projectileMesh, aggregate, collisionObserver);
  }

  // ─────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────
  private destroy(
    mesh:              Mesh,
    aggregate:         PhysicsAggregate,
    collisionObserver: Observer<IPhysicsCollisionEvent>
  ): void {
    if (mesh.isDisposed()) return;
    aggregate.body.getCollisionObservable().remove(collisionObserver);
    aggregate.dispose();
    mesh.dispose();
  }
}