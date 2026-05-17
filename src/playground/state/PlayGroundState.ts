import { Vector3 } from "@babylonjs/core";
import { type Area } from "../builders/BuildMap";

export class PlayGroundState {

  private static _instance: PlayGroundState | null = null;
  private _openAreas: Area[] = [];
  private _emptyPoints: Vector3[] = [];

  private constructor() {}

  static getInstance(): PlayGroundState {
    PlayGroundState._instance ??= new PlayGroundState();
    return PlayGroundState._instance;
  }

  updateOpenAreas(areas: Area[]): void {
    this._openAreas = areas;
  }

  updateEmptyPoints(points: Vector3[]): void {
    this._emptyPoints = points;
  }

  getAreas(): Area[] {
    return this._openAreas;
  }

  getEmptyPoints(): Vector3[] {
    return this._emptyPoints;
  }

  getCharacterInitialAssignedPosition(): Vector3 {
    const smallest = this._openAreas.pop()?.center;
    console.warn('smallest',smallest);
    if (smallest) {
      smallest._y += 5;
      return smallest;
    }
    return new Vector3(0, 0.9, 0);
  }

}