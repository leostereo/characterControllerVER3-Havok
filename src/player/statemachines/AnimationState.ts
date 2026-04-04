export type AnimationStateValue =
  | "idle"
  | "walk"
  | "run"
  | "jump_start"
  | "jump"
  | "fall"
  | "walk_back"
  | "attack";

export interface AnimationState {
  current: AnimationStateValue;
}

export class AnimationStateMachine implements AnimationState {
  current: AnimationStateValue = "idle";

  setState(state: AnimationStateValue): void {
    this.current = state;
  }
}