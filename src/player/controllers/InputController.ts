import { type InputState } from "../statemachines/InputState";



export class InputController {
  constructor(private inputState: InputState) {
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
  };

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}