// src/enemies/interfaces/IBaseController.ts

export interface IBaseController {
  start(): void;
  stop(): void;
  removeAgent(): void;   // ← nuevo
  dispose(): void;
}