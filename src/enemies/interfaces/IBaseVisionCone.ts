// src/enemies/interfaces/IBaseVisionCone.ts

export interface IBaseVisionCone<TState extends string> {
  buildVisuals(): void;
  update(state: TState): void;
  dispose(): void;
}