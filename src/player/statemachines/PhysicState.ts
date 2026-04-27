import { EventManager } from "@/game/eventManager/eventManager";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export interface PhysicState {
  grounded: boolean;
  velocity: Vector3;
  forward: Vector3;
  position: Vector3;
  speed: number;
  eventManager: EventManager;
}

export class PhysicState implements PhysicState {
  eventManager = EventManager.getInstance();
  grounded = false;
  velocity = Vector3.Zero();
  position = Vector3.Zero();
  forward = Vector3.Zero();
  speed = 0;
  apply_hit_impulse = false;
  projectile_direction = Vector3.Zero(); // ← inicializada



  constructor() {
    this.eventManager.subscribe((event) => {
      if (event.type === "projectile_hit") {
        const data = event.data as { direction: Vector3; hitMeshName: string };
        this.apply_hit_impulse = true;
        this.projectile_direction          = data.direction;
      }
    });
  }

  setVelocity(velocity: Vector3): void {
    this.velocity.copyFrom(velocity);
    this.speed = new Vector3(velocity.x, 0, velocity.z).length();
  }

  setPosition(position: Vector3): void {
    if (position) {
      this.position.copyFrom(position);
    }
  }

  setForward(forward: Vector3): void {
    if (forward) {
      this.forward.copyFrom(forward);
    }
  }

  setGrounded(value: boolean): void {
    this.grounded = value;
  }

  getThrowPArams(): { forward: Vector3, position: Vector3 } {
    return { forward: this.forward, position: this.position }
  }

  getHitData(): { recibed_impact: boolean; impact_direction: Vector3 } {
    return {
      recibed_impact:   this.apply_hit_impulse,
      impact_direction: this.projectile_direction, 
    };
  }

  // Llamar esto después de consumir el impacto en el controller
  clearHitImpulse(): void {
    this.apply_hit_impulse = false;
    this.projectile_direction          = Vector3.Zero();
  }

}