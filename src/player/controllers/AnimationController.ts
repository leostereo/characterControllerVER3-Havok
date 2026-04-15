import { type AnimationGroup } from "@babylonjs/core";
import { type InputState } from "../statemachines/InputState";
import { type PhysicState } from "../statemachines/PhysicState";
import { type AnimationStateValue, type AnimationStateMachine } from "../statemachines/AnimationState";
import { type AnimationGroupsManager } from "../managers/AnimationGroupsMaanger";

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
    private animationGroupsManager: AnimationGroupsManager  // Cambiado
  ) {


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

    this.animationGroupsManager.groups[state]?.stop();  // Cambiado
    // Update animation state machine
    this.animationState.setState(state);

    // Play the corresponding animation
    const group = this.animationGroupsManager.groups[state] ?? this.animationGroupsManager.groups.idle;  // Cambiado
    if (group) group.start(true, group.speedRatio, group.from, group.to, true);
  }
}