import { type AnimationStateMachine } from "../statemachines/AnimationState";
import { type InputState } from "../statemachines/InputState";



export class InputController {
  constructor(private inputState: InputState, private animationState:AnimationStateMachine) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "KeyW") this.inputState.moveZ = 1;
    if (event.code === "KeyS") this.inputState.moveZ = -1;
    if (event.code === "KeyA") this.inputState.turn = -1;
    if (event.code === "KeyD") this.inputState.turn = 1;
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") this.inputState.run = true;
    if (event.code === "Space") this.inputState.action = "jump";
    if (event.code === "KeyJ") {this.inputState.action = "throw"};
    if (event.code === "KeyK") {this.inputState.action = "rollOrDuck"};
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    if (event.code === "KeyW" || event.code === "KeyS") this.inputState.moveZ = 0;
    if (event.code === "KeyA" || event.code === "KeyD") this.inputState.turn = 0;
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") this.inputState.run = false;
    if (event.code === "Space" && this.inputState.action === "jump") {
      this.inputState.action = "none";
    }
    if (event.code === "KeyJ" && this.inputState.action === "throw") {
      this.inputState.action = "none";
    }
    if (event.code === "KeyK" && this.inputState.action === "rollOrDuck") {
      if(this.animationState.current === 'crunch_idle'){
        this.animationState.blockingAnimationIsPlaying = false;
      }
      this.inputState.action = "none";
    }
  };

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}