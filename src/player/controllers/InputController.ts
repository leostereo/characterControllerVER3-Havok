// src/player/controllers/InputController.ts

import type { AnimationStateMachine } from "../statemachines/AnimationState";
import type { CommandDispatcher } from "@/input/CommandDispatcher";

export class InputController {

  constructor(
    private dispatcher: CommandDispatcher,
    private animationState: AnimationStateMachine,
  ) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    switch (event.code) {
      case "KeyW": this.dispatcher.dispatch({ type: "move", value: 1 }); break;
      case "KeyS": this.dispatcher.dispatch({ type: "move", value: -1 }); break;
      case "KeyA": this.dispatcher.dispatch({ type: "turn", value: -1 }); break;
      case "KeyD": this.dispatcher.dispatch({ type: "turn", value: 1 }); break;
      case "ShiftLeft": case "ShiftRight": this.dispatcher.dispatch({ type: "run", value: true }); break;
      case "Space": this.dispatcher.dispatch({ type: "action", value: "jump" }); break;
      case "KeyJ": this.dispatcher.dispatch({ type: "action", value: "throw" }); break;
      case "KeyK": this.dispatcher.dispatch({ type: "action", value: "rollOrDuck" }); break;
      case "KeyQ": this.dispatcher.dispatch({ type: "superVision", value: true }); break;
      case "KeyH": this.dispatcher.dispatch({ type: "help" }); break;
      case "KeyR": this.dispatcher.dispatch({ type: "restart" }); break;
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    switch (event.code) {
      case "KeyW": case "KeyS":
        this.dispatcher.dispatch({ type: "resetMove" });
        break;
      case "KeyA": case "KeyD":
        this.dispatcher.dispatch({ type: "resetTurn" });
        break;
      case "ShiftLeft": case "ShiftRight":
        this.dispatcher.dispatch({ type: "run", value: false });
        break;
      case "Space":
        this.dispatcher.dispatch({ type: "action", value: "none" });
        break;
      case "KeyJ":
        this.dispatcher.dispatch({ type: "action", value: "none" });
        break;
      case "KeyK":
        if (this.animationState.current === "crunch_idle" ||
          this.animationState.current === "sneaking_forward") {
          this.animationState.blockingAnimationIsPlaying = false;
        }
        this.dispatcher.dispatch({ type: "action", value: "none" });
        break;
      case "KeyQ": this.dispatcher.dispatch({ type: "superVision", value: false })
        ; break;
    }
  };

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}