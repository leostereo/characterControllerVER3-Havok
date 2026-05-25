import { Vector3 } from "@babylonjs/core";
import { type Area } from "../builders/BuildMap";

export class PlayGroundState {

  private static _instance: PlayGroundState | null = null;
  private _openAreas: Area[] = [];
  private _emptyPoints: Vector3[] = [];
  private _spawnPoint:   Vector3   = new Vector3(0, 0.9, 0);  // ← fallback

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

  updateSpawnPoint(point: Vector3): void {   // ← nuevo
    this._spawnPoint = point.clone();
  }

  getAreas(): Area[] {
    return this._openAreas;
  }

  getEmptyPoints(): Vector3[] {
    return this._emptyPoints;
  }

  getSpawnPoint(): Vector3 {                 // ← nuevo
    return this._spawnPoint.clone();
  }

}