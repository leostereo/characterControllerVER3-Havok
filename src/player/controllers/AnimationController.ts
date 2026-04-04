import type { AnimationGroup } from "@babylonjs/core";
import { type InputState } from "../statemachines/InputState";
import { type PhysicState } from "../statemachines/PhysicState";
import { type AnimationStateMachine } from "../statemachines/AnimationState";

type AnimState = "idle" | "walk" | "run" | "jump_start" | "jump" | "fall" | "walk_back" | "attack";

export class AnimationController {
  private groups: Record<AnimState, AnimationGroup | undefined> = {
    idle: undefined,
    walk: undefined,
    run: undefined,
    jump_start: undefined,
    jump: undefined,
    fall: undefined,
    walk_back: undefined,
    attack: undefined
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
    this.groups.walk = animationGroups.find((item) => item.name === "walking");
    this.groups.walk_back = animationGroups.find((item) => item.name === "walking backwards");
    this.groups.run = animationGroups.find((item) => item.name === "slow running");
    console.warn("Animation groups set:", Object.keys(this.groups).filter(k => this.groups[k as AnimState]));

    // Stop all animations on initialization
    Object.values(this.groups).forEach((g) => {
      if (g?.isPlaying) {
        g.stop();
      }
    });
  }

  update(): void {
    let next: AnimState = "idle";

    if (!this.physicState.grounded) {
      next = this.physicState.velocity.y > 0 ? "jump_start" : "fall";
    } else if (this.physicState.speed > 1) {
      if (this.inputState.moveZ < 0) {
        next = "walk_back";
      } else {
        next = this.inputState.run ? "run" : "walk";
      }
    }

    this.play(next);
  }

  private play(state: AnimState): void {
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