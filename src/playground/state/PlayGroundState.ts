import { Vector3 } from "@babylonjs/core";
import { type Area } from "../builders/BuildMap";

export class PlayGroundState {

  private static _instance: PlayGroundState | null = null;
  private _areas: Area[] = [];

  private constructor() {}

  static getInstance(): PlayGroundState {
    PlayGroundState._instance ??= new PlayGroundState();
    return PlayGroundState._instance;
  }

  update(areas: Area[]): void {
    this._areas = areas;
  }

  getAreas(): Area[] {
    return this._areas;
  }

  getCharacterInitialAssignedPosition(): Vector3 {
    const smallest = this._areas.pop()?.center;
    console.warn('smallest',smallest);
    if (smallest) {
      smallest._y += 5;
      return smallest;
    }
    return new Vector3(0, 0.9, 0);
  }

}