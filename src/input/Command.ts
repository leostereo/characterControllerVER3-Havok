// src/input/Command.ts

export type ActionType = "none" | "jump" | "attack" | "rollOrDuck" | "throw";

export type Command =
  | { type: "move", value: number }
  | { type: "turn", value: number }
  | { type: "run", value: boolean }
  | { type: "action", value: ActionType }
  | { type: "resetMove" }
  | { type: "resetTurn" }
  | { type: "superVision", value:boolean }
  | { type: "help" }
  | { type: "restart" };