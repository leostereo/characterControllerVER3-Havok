import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export interface PhysicState {
  grounded: boolean;
  velocity: Vector3;
  speed: number;
}

export class PhysicState implements PhysicState {
  grounded = false;
  velocity = Vector3.Zero();
  speed = 0;

  setVelocity(velocity: Vector3): void {
    this.velocity.copyFrom(velocity);
    this.speed = new Vector3(velocity.x, 0, velocity.z).length();
  }

  setGrounded(value: boolean): void {
    this.grounded = value;
  }
}