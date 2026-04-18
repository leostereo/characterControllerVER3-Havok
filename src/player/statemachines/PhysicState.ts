import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export interface PhysicState {
  grounded: boolean;
  velocity: Vector3;
  forward: Vector3;
  position: Vector3;
  speed: number;
}

export class PhysicState implements PhysicState {
  grounded = false;
  velocity = Vector3.Zero();
  position = Vector3.Zero();
  forward = Vector3.Zero();
  speed = 0;

  setVelocity(velocity: Vector3): void {
    this.velocity.copyFrom(velocity);
    this.speed = new Vector3(velocity.x, 0, velocity.z).length();
  }

  setPosition(position: Vector3): void {
    if(position){
      this.position.copyFrom(position);
    }
  }

  setForward(forward: Vector3): void {
    if(forward){
      this.forward.copyFrom(forward);
    }
  }

  setGrounded(value: boolean): void {
    this.grounded = value;
  }

  getThrowPArams():{forward:Vector3,position:Vector3}{
    return {forward:this.forward,position:this.position}
  }
}