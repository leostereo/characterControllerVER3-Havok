export interface IInputState {
  moveZ: number; // -1 atrás, 0 parado, +1 adelante
  turn: number;  // -1 izquierda, 0 nada, +1 derecha
  run: boolean;
  action: "none" | "jump" | "attack";
}

export class InputState implements IInputState {
  moveZ = 0;
  turn = 0;
  run = false;
  action: "none" | "jump" | "attack" = "none";

  resetAction(): void {
    this.action = "none";
  }
}