// src/enemies/interfaces/IBaseEnemy.ts

import { type IBaseEnemy } from "./IBaseEnemy";

export interface ICyborgMain extends IBaseEnemy {
  processExternalRequest(): void;
}