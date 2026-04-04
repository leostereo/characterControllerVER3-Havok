import type { AnimationGroup } from "@babylonjs/core";
import { type InputState } from "../statemachines/InputState";
import { type PhysicState } from "../statemachines/PhysicState";
import { type AnimationStateValue, type AnimationStateMachine } from "../statemachines/AnimationState";

export class AnimationController {
  private groups: Record<AnimationStateValue, AnimationGroup | undefined> = {
    idle: undefined,
    walking: undefined,
    running: undefined,
    jump_impulse_starts: undefined,
    jump_impulse_is_over: undefined,
    jumping: undefined,
    falling_to_land: undefined,
    falling_to_crash: undefined,
    walking_backwards: undefined,
  };

  constructor(
    private inputState: InputState,
    private physicState: PhysicState,
    private animationState: AnimationStateMachine,
    animationGroups: AnimationGroup[] = []
  ) {
    this.mapAnimationGroups(animationGroups);
  }

  /**
   * Maps animation groups by name to the corresponding state
   */
  private mapAnimationGroups(animationGroups: AnimationGroup[]): void {
    this.groups.idle = animationGroups.find((item) => item.name === "idle");
    this.groups.walking = animationGroups.find((item) => item.name === "walking");
    this.groups.walking_backwards = animationGroups.find((item) => item.name === "walking backwards");
    this.groups.running = animationGroups.find((item) => item.name === "slow running");

    //jump
    this.groups.jumping = animationGroups.find((item) => item.name === "jumping");
    this.groups.jump_impulse_starts = this.groups.jumping;
    this.groups.jump_impulse_is_over = this.groups.jumping;

    console.warn("Animation groups set:", Object.keys(this.groups).filter(k => this.groups[k as AnimationStateValue]));

    // Stop all animations on initialization
    Object.values(this.groups).forEach((g) => {
      if (g?.isPlaying) {
        g.stop();
      }
    });
  }

  update(): void {

    //Animation desicion matrix
    let next: AnimationStateValue = "idle";

    //IN THE AIR
    if (!this.physicState.grounded) {
      next = this.physicState.velocity.y > 0 ? "jumping" : "falling_to_crash";
    }

    //ON THE GROUND
    if (this.physicState.grounded) {

      if (this.inputState.action === 'jump' && this.animationState.current !== 'jump_impulse_starts') {
        next = "jump_impulse_starts"
      }

      if (this.physicState.speed > 1 && this.inputState.moveZ < 0) {
        next = "walking_backwards";
      }

      if (this.physicState.speed > 1 && this.inputState.moveZ > 0) {
        next = this.inputState.run ? "running" : "walking";
      }
    }

    this.play(next);
  }

  private play(state: AnimationStateValue): void {
    if (this.animationState.current === state) return;

    // Update animation state machine
    this.animationState.setState(state);

    // Stop all animations
    Object.values(this.groups).forEach((g) => {
      if (g?.isPlaying) {
        g.stop();
      }
    });

    // Play the corresponding animation
    const group = this.groups[state] ?? this.groups.idle;
    if (group) group.start(true, 1.0, group.from, group.to, true);
  }
}