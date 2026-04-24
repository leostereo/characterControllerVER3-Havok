export type AnimationStateValue =
  | "idle"
  | "walking"
  | "walking_backwards"
  | "running"
  | "jump_impulse_starts"
  | "jump_impulse_is_over"
  | "jumping"
  | "falling_to_crash"
  | "falling_down"
  | "landing_safety"
  | "crashing_flat"
  | "throwing"
  | "throwing_impulse_is_over"
  | "air_throwing"
  | "air_throwing_impulse_is_over"
  | "rolling"
  | "standing_to_crunch"
  | "crunch_idle"
  | "crouched_to_standing"
  | "impact_force_applied"
  | "impact_recibed"
  | "none"

export interface AnimationState {
  current: AnimationStateValue;
}

export class AnimationStateMachine implements AnimationState {

  current: AnimationStateValue = "none";
  blockingAnimationIsPlaying = false;

  public setState(state: AnimationStateValue): void {
    this.current = state;
  }
}