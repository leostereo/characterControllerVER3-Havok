import { type AnimationGroup, AnimationEvent } from "@babylonjs/core";
import { type AnimationStateValue, type AnimationStateMachine } from "../statemachines/AnimationState";

export class AnimationGroupsManager {
  public groups: Record<AnimationStateValue, AnimationGroup | undefined> = {
    idle: undefined,
    walking: undefined,
    running: undefined,
    jump_impulse_starts: undefined,
    jump_impulse_is_over: undefined,
    jumping: undefined,
    falling_down: undefined,
    landing_safety: undefined,
    falling_to_crash: undefined,
    crashing_flat: undefined,
    walking_backwards: undefined,
    none: undefined
  };

  constructor(animationGroups: AnimationGroup[], private animationState: AnimationStateMachine) {
    this.stopAllAnimations(animationGroups);
    this.mapAnimationGroups(animationGroups);
    this.disposeUnusedAnimations(animationGroups);
  }

  private stopAllAnimations(animationGroups: AnimationGroup[]): void {
    animationGroups.forEach((ag: AnimationGroup) => ag.stop());
  }

  private mapAnimationGroups(animationGroups: AnimationGroup[]): void {
    this.groups.idle = animationGroups.find((item) => item.name === "idle");
    this.groups.walking = animationGroups.find((item) => item.name === "walking");
    this.groups.walking_backwards = animationGroups.find((item) => item.name === "walking backwards");
    this.groups.running = animationGroups.find((item) => item.name === "slow running");

    // Jump
    this.groups.jumping = animationGroups.find((item) => item.name === "falling idle");
    this.groups.falling_down = animationGroups.find((item) => item.name === "fall a loop");
    this.groups.falling_to_crash = animationGroups.find((item) => item.name === "falling impact");

    // Land-crash
    this.groups.crashing_flat = animationGroups.find((item) => item.name === "falling flat impact");
    if (this.groups.crashing_flat) {
      this.groups.crashing_flat.onAnimationGroupLoopObservable.add(() => {
        this.animationState.blockingAnimationIsPlaying = false;
      });
      this.groups.crashing_flat.from = 20;
    }

    // Safety landing
    const landing_event = new AnimationEvent(60, () => {
      this.animationState.blockingAnimationIsPlaying = false;
    }, true);
    this.groups.landing_safety = animationGroups.find((item) => item.name === "falling to landing");
    if (this.groups.landing_safety) {
      this.groups.landing_safety.from = 20;
      this.groups.landing_safety.to = 65;
      this.groups.landing_safety.speedRatio = 1.5;
    }
    const landing_anim = this.groups.landing_safety?.targetedAnimations[0].animation;
    landing_anim?.addEvent(landing_event);

    // Jumping impulse start and over
    const event = new AnimationEvent(30, () => {
      this.animationState.blockingAnimationIsPlaying = false;
      this.animationState.current = "jump_impulse_is_over";
    }, true);
    this.groups.jump_impulse_starts = animationGroups.find((item) => item.name === "jumping");
    if (this.groups.jump_impulse_starts) {
      this.groups.jump_impulse_starts.speedRatio = 1.5;
    }
    const anim = this.groups.jump_impulse_starts?.targetedAnimations[0].animation;
    anim?.addEvent(event);

    this.groups.jump_impulse_is_over = this.groups.jumping;

    console.warn("Animation groups set:", Object.keys(this.groups).filter(k => this.groups[k as AnimationStateValue]));
  }

  private disposeUnusedAnimations(animationGroups: AnimationGroup[]): void {
    const usedGroups = new Set<AnimationGroup>(
      Object.values(this.groups).filter((group): group is AnimationGroup => group !== undefined)
    );

    animationGroups.forEach((group) => {
      if (!usedGroups.has(group)) {
        group.dispose();
        // console.warn(`Disposed unused animation group: ${group.name}`);
      }
    });
  }
}