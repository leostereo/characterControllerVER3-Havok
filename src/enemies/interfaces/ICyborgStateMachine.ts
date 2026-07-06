// src/enemies/interfaces/ICyborgStateMachine.ts

import { type CyborgState } from "../cyborg/CyborgFSM";
import { type IBaseStateMachine } from "./IBaseStateMachine";

export interface ICyborgStateMachine extends IBaseStateMachine<CyborgState> {
  onHitReactionEnded():       void;
  onDefeatedAnimationEnded(): void;
  savePreviousState():        void;
  isDefeated():               boolean;
  isPaused():                 boolean;
  getHealth():                number;
  tick(dt: number):           void;
}