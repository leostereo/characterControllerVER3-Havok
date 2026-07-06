// src/debug/CyborgDebugger.ts

import type { Scene, Observer }               from "@babylonjs/core";
import type { ICyborgStateMachine } from "@/enemies/interfaces/ICyborgStateMachine";
import { CyborgDebugGUI }           from "./CyborgDebugGUI";
import { CyborgDebugMarkers }       from "./CyborgDebugMarkers";
import { type CyborgController } from "@/enemies/cyborg/CyborgController";

export class CyborgDebugger {

  private gui:            CyborgDebugGUI;
  private markers:        CyborgDebugMarkers;
  private renderObserver: Observer<Scene> | null = null;

  constructor(
    private scene:      Scene,
    private fsm:        ICyborgStateMachine,
    private controller: CyborgController,
  ) {
    this.gui     = new CyborgDebugGUI(scene, fsm);
    this.markers = new CyborgDebugMarkers(scene);
    this.startLoop();
  }

  private startLoop(): void {
    this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
      this.markers.update(
        this.controller.getLastKnownPosition(),
        this.controller.getSearchDestination(),
      );
    });
  }

  dispose(): void {
    if (this.renderObserver) {
      this.scene.onBeforeRenderObservable.remove(this.renderObserver);
    }
    this.gui.dispose();
    this.markers.dispose();
  }
}