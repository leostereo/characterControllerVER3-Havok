import type { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture, Button, StackPanel, TextBlock } from "@babylonjs/gui/2D";
import { EventManager, type GameEvent } from "../eventManager/eventManager";

export const setUI = async (scene: Scene): Promise<void> => {
  if (scene.getEngine().name === "WebGPU") {
    // WebGPU specific imports
    await import("@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture");
    await import("@babylonjs/core/Engines/WebGPU/Extensions/engine.renderTarget");
    console.warn("WebGPU GUI extensions loaded");
  }

  const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("myUI");

  const panel = new StackPanel();
  panel.width = 0.15;
  panel.height = 50;
  panel.verticalAlignment = 0;
  panel.horizontalAlignment = 0;
  panel.isVertical = true;
  panel.topInPixels = 20;
  advancedTexture.addControl(panel);

  // Contador de disparos
  const shotCounterText = new TextBlock();
  shotCounterText.text = "Shots: 0";
  shotCounterText.height = "40px";
  shotCounterText.color = "white";
  shotCounterText.fontSize = 24;
  panel.addControl(shotCounterText);

  let shotCount = 0;
  const eventManager = EventManager.getInstance();
  const shotObserver = eventManager.subscribe((event: GameEvent) => {
    if (event.type === "projectile_fired" && event.source === "player") {
      shotCount++;
      shotCounterText.text = `Shots: ${shotCount}`;
    }
  });


  const disposeButton = Button.CreateSimpleButton("disposeButton", "Dispose GUI");
  disposeButton.width = 0.9;
  disposeButton.height = "40px";
  disposeButton.color = "white";
  disposeButton.background = "Maroon";
  panel.addControl(disposeButton);

  disposeButton.onPointerUpObservable.addOnce(() => {
    eventManager.unsubscribe(shotObserver); // Limpiar suscripción al destruir GUI
    advancedTexture.dispose();
  });
};