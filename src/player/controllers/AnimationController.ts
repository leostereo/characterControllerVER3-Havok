import { type AnimationGroup, AnimationEvent } from "@babylonjs/core";
import { type InputState } from "../statemachines/InputState";
import { type PhysicState } from "../statemachines/PhysicState";
import { type AnimationStateValue, type AnimationStateMachine } from "../statemachines/AnimationState";
import { clusteredLightingFunctions } from "@babylonjs/core/Shaders/ShadersInclude/clusteredLightingFunctions";

export class AnimationController {
  private groups: Record<AnimationStateValue, AnimationGroup | undefined> = {
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

  constructor(
    private inputState: InputState,
    private physicState: PhysicState,
    private animationState: AnimationStateMachine,
    animationGroups: AnimationGroup[] = []
  ) {

    this.stopAllAnimations(animationGroups);
    this.mapAnimationGroups(animationGroups);
    this.disposehUnusedAnimations(animationGroups);
  }


  private disposehUnusedAnimations(animationGroups: AnimationGroup[]): void {
    const usedGroups = new Set<AnimationGroup>(
      Object.values(this.groups).filter((group): group is AnimationGroup => group !== undefined)
    );

    animationGroups.forEach((group) => {
      if (!usedGroups.has(group)) {
        group.dispose();
        //console.warn(`Disposed unused animation group: ${group.name}`);
      }
    });
  }


  private stopAllAnimations(animationGroups: AnimationGroup[]): void {
    animationGroups.forEach((ag: AnimationGroup) => ag.stop());
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
    this.groups.jumping = animationGroups.find((item) => item.name === "falling idle");
    this.groups.falling_down = animationGroups.find((item) => item.name === "fall a loop");
    this.groups.falling_to_crash = animationGroups.find((item) => item.name === "falling impact");

    //land-crash
    this.groups.crashing_flat = animationGroups.find((item) => item.name === "falling flat impact");
    if(this.groups.crashing_flat){
      this.groups.crashing_flat.onAnimationGroupLoopObservable.add(() => { this.animationState.blockingAnimationIsPlaying = false });
      this.groups.crashing_flat.from = 20;
    }

    //safety landing
    const landing_event = new AnimationEvent(60, () => {this.animationState.blockingAnimationIsPlaying = false}, true);
    this.groups.landing_safety = animationGroups.find((item) => item.name === "falling to landing");
    if(this.groups.landing_safety){
      this.groups.landing_safety.from = 20;
      this.groups.landing_safety.to = 65
      this.groups.landing_safety.speedRatio = 1.5;
    }

    const landing_anim = this.groups.landing_safety?.targetedAnimations[0].animation;
    landing_anim?.addEvent(landing_event);


    //jumping impulse start and over
    const event = new AnimationEvent(30, () => {
      this.animationState.blockingAnimationIsPlaying = false;
      this.animationState.current = "jump_impulse_is_over"
    }, true);

    this.groups.jump_impulse_starts = animationGroups.find((item) => item.name === "jumping");
    if(this.groups.jump_impulse_starts){
      this.groups.jump_impulse_starts.speedRatio = 1.5;
    }
    const anim = this.groups.jump_impulse_starts?.targetedAnimations[0].animation;
    anim?.addEvent(event);

    this.groups.jump_impulse_is_over = this.groups.jumping;

    console.warn("Animation groups set:", Object.keys(this.groups).filter(k => this.groups[k as AnimationStateValue]));

  }

  update(): void {

    if (this.animationState.blockingAnimationIsPlaying) return;

    //Animation desicion matrix
    let next: AnimationStateValue = "idle";

    //IN THE AIR
    if (!this.physicState.grounded) {

      if (this.animationState.current === 'jump_impulse_is_over' || this.animationState.current === 'jumping') {
        next = 'jumping'
      }

      if (this.physicState.velocity._y < -3) {
        next = 'falling_down';
      }

      if (this.physicState.velocity._y < -15) {
        next = 'falling_to_crash';
      }

    }

    //ON THE GROUND
    if (this.physicState.grounded) {

      if (this.animationState.current === 'falling_to_crash') {
        next = 'crashing_flat'
        this.animationState.blockingAnimationIsPlaying = true;
      }

      if (this.animationState.current === 'falling_down') {
        next = 'landing_safety'
        this.animationState.blockingAnimationIsPlaying = true;
      }

      if (this.animationState.current === 'jump_impulse_is_over') {
        return;
      }

      if (this.physicState.speed > 1 && this.inputState.moveZ < 0) {
        next = "walking_backwards";
      }

      if (this.physicState.speed > 1 && this.inputState.moveZ > 0) {
        next = this.inputState.run ? "running" : "walking";
      }

      if (this.inputState.action === 'jump' && this.animationState.current !== 'jump_impulse_starts') {
        next = "jump_impulse_starts"
        this.animationState.blockingAnimationIsPlaying = true;
      }

    }

    this.play(next);
  }

  private play(state: AnimationStateValue): void {
    if (this.animationState.current === state) return;

    this.groups[state]?.stop();
    // Update animation state machine
    this.animationState.setState(state);

    // Play the corresponding animation
    const group = this.groups[state] ?? this.groups.idle;
    if (group) group.start(true, group.speedRatio, group.from, group.to, true);
  }
}