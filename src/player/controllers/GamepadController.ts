import type { AnimationStateMachine } from "../statemachines/AnimationState";
import type { CommandDispatcher } from "@/input/CommandDispatcher";

const DEADZONE = 0.15;

export class GamepadController {

  private animFrameId: number | null = null;
  private prevButtons: boolean[] = [];
  private gpMoveZ = 0;
  private gpTurn = 0;

  constructor(
    private dispatcher: CommandDispatcher,
    private animationState: AnimationStateMachine,
  ) {
    window.addEventListener("gamepadconnected", this.onConnected);
    window.addEventListener("gamepaddisconnected", this.onDisconnected);
    this.startLoop();
  }

  private onConnected = (e: GamepadEvent): void => {
    console.warn(`[GamepadController] conectado: ${e.gamepad.id}`);
  };

  private onDisconnected = (e: GamepadEvent): void => {
    console.warn(`[GamepadController] desconectado: ${e.gamepad.id}`);
    this.dispatcher.dispatch({ type: "resetMove" });
    this.dispatcher.dispatch({ type: "resetTurn" });
    this.dispatcher.dispatch({ type: "run", value: false });
    this.dispatcher.dispatch({ type: "action", value: "none" });
  };

  private startLoop(): void {
    const loop = (): void => {
      this.poll();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private poll(): void {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;

    // ── Sticks ──
    const axisX = gp.axes[0];
    const axisY = gp.axes[1];

    const newMoveZ = Math.abs(axisY) > DEADZONE ? -axisY : 0;
    const newTurn = Math.abs(axisX) > DEADZONE ? axisX : 0;

    if (newMoveZ !== this.gpMoveZ) {
      this.gpMoveZ = newMoveZ;
      if (newMoveZ !== 0) this.dispatcher.dispatch({ type: "move", value: newMoveZ });
      else this.dispatcher.dispatch({ type: "resetMove" });
    }

    if (newTurn !== this.gpTurn) {
      this.gpTurn = newTurn;
      if (newTurn !== 0) this.dispatcher.dispatch({ type: "turn", value: newTurn });
      else this.dispatcher.dispatch({ type: "resetTurn" });
    }

    // ── Run ──
    const rightTrigger = gp.buttons[7]?.value ?? 0;
    this.dispatcher.dispatch({ type: "run", value: rightTrigger > 0.5 });

    // ── Botones ──
    this.handleButton(gp, 0,
      () => this.dispatcher.dispatch({ type: "action", value: "jump" }),
      () => this.dispatcher.dispatch({ type: "action", value: "none" }),
    );
    this.handleButton(gp, 2,
      () => this.dispatcher.dispatch({ type: "action", value: "throw" }),
      () => this.dispatcher.dispatch({ type: "action", value: "none" }),
    );
    this.handleButton(gp, 1,
      () => this.dispatcher.dispatch({ type: "action", value: "rollOrDuck" }),
      () => {
        if (this.animationState.current === "crunch_idle" ||
          this.animationState.current === "sneaking_forward") {
          this.animationState.blockingAnimationIsPlaying = false;
        }
        this.dispatcher.dispatch({ type: "action", value: "none" });
      },
    );
    this.handleButton(gp, 3,
      () => this.dispatcher.dispatch({ type: "superVision", value: true }),
      () => this.dispatcher.dispatch({ type: "superVision", value: false })
    );
    this.handleButton(gp, 9,
      () => this.dispatcher.dispatch({ type: "restart" }),
      () => { }
    );
  }

  private handleButton(
    gp: Gamepad,
    index: number,
    onDown: () => void,
    onUp: () => void,
  ): void {
    const pressed = gp.buttons[index]?.pressed ?? false;
    const wasPressed = this.prevButtons[index] ?? false;
    if (pressed && !wasPressed) onDown();
    if (!pressed && wasPressed) onUp();
    this.prevButtons[index] = pressed;
  }

  dispose(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener("gamepadconnected", this.onConnected);
    window.removeEventListener("gamepaddisconnected", this.onDisconnected);
  }
}