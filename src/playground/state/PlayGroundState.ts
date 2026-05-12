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
}