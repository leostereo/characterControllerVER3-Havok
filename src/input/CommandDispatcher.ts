import type { InputState } from "@/player/statemachines/InputState";
import { type Command } from "./Command";

export class CommandDispatcher {

  private handlers = new Map<string, (value?: boolean | number) => void>();

  constructor(private inputState: InputState) { }

  // ─────────────────────────────────────────────
  //  DISPATCH
  // ─────────────────────────────────────────────
  dispatch(command: Command): void {
    switch (command.type) {
      case "move": this.inputState.moveZ = command.value; break;
      case "turn": this.inputState.turn = command.value; break;
      case "run": this.inputState.run = command.value; break;
      case "action": this.inputState.action = command.value; break;
      case "resetMove": this.inputState.moveZ = 0; break;
      case "resetTurn": this.inputState.turn = 0; break;
      case "superVision":
        const superVisionFunction = this.handlers.get('superVision');
        if (superVisionFunction) {
          superVisionFunction(command.value);
        }
        break;
      case "help":
        const helpFunction = this.handlers.get('toggleControls');
        if (helpFunction) {
          helpFunction();
        }
        break;
      default: {
        const handler = this.handlers.get(command.type);
        if (!handler) break;

        if ("value" in command) {
          handler((command as { value: boolean | number }).value);
        } else {
          handler();
        }
        break;
      }
    }
  }

  // ─────────────────────────────────────────────
  //  REGISTRO DE HANDLERS EXTERNOS
  // ─────────────────────────────────────────────
  register(commandType: string, handler: (value?: boolean|number) => void): void {
    this.handlers.set(commandType, handler);
  }

  unregister(commandType: string): void {
    this.handlers.delete(commandType);
  }
}