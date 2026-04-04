export type AnimationStateValue =
  | "idle"
  | "walking"
  | "running"
  | "jump_impulse_starts"
  | "jump_impulse_is_over"
  | "jumping"
  | "falling_to_land"
  | "falling_to_crash"
  | "walking_backwards"

export interface AnimationState {
  current: AnimationStateValue;
}

export class AnimationStateMachine implements AnimationState {
  current: AnimationStateValue = "idle";

  setState(state: AnimationStateValue): void {
    this.current = state;
  }
}