export type AnimationStateValue =
  | "idle"
  | "walking"
  | "running"
  | "jump_impulse_starts"
  | "jump_impulse_is_over"
  | "jumping"
  | "landing_safety"
  | "falling_to_crash"
  | "crashing_flat"
  | "falling_down"
  | "walking_backwards"
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