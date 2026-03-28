import { PlayerController } from "./PlayerController";

export class PlayerEffectsController {
  private wasGrounded = true;

  constructor(private player: PlayerController) {}

  update(): void {
    const isGrounded = this.player.isGrounded;
    const speed = this.player.speed;

    // Landing effect
    if (isGrounded && !this.wasGrounded) {
      this.playLandingEffect();
    }

    // Jump effect
    if (!isGrounded && this.wasGrounded) {
      this.playJumpEffect();
    }

    // Footsteps while moving on ground
    if (speed > 0.5 && isGrounded) {
      this.playFootstepSound();
    }

    this.wasGrounded = isGrounded;
  }

  private playLandingEffect(): void {
    console.log("Landing effect triggered");
    // Implement particle effect or sound for landing
  }

  private playJumpEffect(): void {
    console.log("Jump effect triggered");
    // Implement particle effect or sound for jumping
  }

  private playFootstepSound(): void {
    console.log("Footstep sound triggered");
    // Implement footstep sound based on speed
  }
}