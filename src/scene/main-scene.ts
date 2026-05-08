import type { Engine } from "@babylonjs/core/Engines/engine";
import type { Scene } from "@babylonjs/core/scene";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import "@babylonjs/core/Helpers/sceneHelpers";
import "@babylonjs/loaders/glTF";
import { Game } from "@/game/Game";

export default class MainScene {

  constructor(private scene: Scene, private canvas: HTMLCanvasElement, private engine: Engine | WebGPUEngine) {
    engine.loadingScreen = {
    displayLoadingUI:         ():void => {},
    hideLoadingUI:            ():void => {},
    loadingUIText:            "",
    loadingUIBackgroundColor: "",
  };
    new Game(scene,engine)
  }
}