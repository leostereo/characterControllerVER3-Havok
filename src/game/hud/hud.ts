// src/game/hud/hud.ts

import type { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture, StackPanel, TextBlock, Rectangle, Control } from "@babylonjs/gui/2D";
import { EventManager, type GameEvent } from "../eventManager/eventManager";

const TRON_CYAN = "#00E5CC";
const TRON_DIM = "#007A6E";
const TRON_RED = "#FF2D55";

export interface HudControls {
  updateLives:       (lives: number) => void;
  updateEnemiesDown: (down: number, total: number) => void;
  showGameOver:      () => void;   // ← sin callback
  showWin:           () => void;   // ← sin callback
  dispose:           () => void;
}

export const setUI = async (scene: Scene): Promise<HudControls> => {
  if (scene.getEngine().name === "WebGPU") {
    await import("@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture");
    await import("@babylonjs/core/Engines/WebGPU/Extensions/engine.renderTarget");
  }

  const ui = AdvancedDynamicTexture.CreateFullscreenUI("gameUI");

  // ── Panel principal — esquina superior izquierda ──
  const panel = new StackPanel();
  panel.width = "220px";
  panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  panel.isVertical = true;
  panel.topInPixels = 20;
  panel.leftInPixels = 20;
  ui.addControl(panel);

  // ── Vidas ──
  const livesText = new TextBlock();
  livesText.text = "⬡ ⬡ ⬡ ⬡ ⬡";
  livesText.height = "36px";
  livesText.color = TRON_CYAN;
  livesText.fontSize = 22;
  livesText.fontFamily = "Courier New";
  livesText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  panel.addControl(livesText);

  // ── Enemies down ──
  const enemiesText = new TextBlock();
  enemiesText.text = "ENEMIES DOWN  0 / 0";
  enemiesText.height = "30px";
  enemiesText.color = TRON_DIM;
  enemiesText.fontSize = 14;
  enemiesText.fontFamily = "Courier New";
  enemiesText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  panel.addControl(enemiesText);

  // ── Shots ──
  const shotText = new TextBlock();
  shotText.text = "SHOTS  0";
  shotText.height = "30px";
  shotText.color = TRON_DIM;
  shotText.fontSize = 14;
  shotText.fontFamily = "Courier New";
  shotText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  panel.addControl(shotText);

  // ── Game Over overlay ──
  const gameOverRect = new Rectangle();
  gameOverRect.width = "400px";
  gameOverRect.height = "200px";
  gameOverRect.background = "#000000CC";
  gameOverRect.color = TRON_RED;
  gameOverRect.thickness = 1;
  gameOverRect.cornerRadius = 8;
  gameOverRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  gameOverRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  gameOverRect.isVisible = false;
  ui.addControl(gameOverRect);

  const gameOverPanel = new StackPanel();
  gameOverPanel.isVertical = true;
  gameOverRect.addControl(gameOverPanel);

  const gameOverText = new TextBlock();
  gameOverText.text = "GAME OVER";
  gameOverText.height = "60px";
  gameOverText.color = TRON_RED;
  gameOverText.fontSize = 36;
  gameOverText.fontFamily = "Courier New";
  gameOverPanel.addControl(gameOverText);

  const restartText = new TextBlock();
  restartText.text = "[ PRESS R TO RESTART ]";
  restartText.height = "40px";
  restartText.color = TRON_CYAN;
  restartText.fontSize = 16;
  restartText.fontFamily = "Courier New";
  gameOverPanel.addControl(restartText);

  const winRect = new Rectangle();
  winRect.width = "400px";
  winRect.height = "200px";
  winRect.background = "#000000CC";
  winRect.color = TRON_CYAN;
  winRect.thickness = 1;
  winRect.cornerRadius = 8;
  winRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  winRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  winRect.isVisible = false;
  ui.addControl(winRect);

  const winPanel = new StackPanel();
  winPanel.isVertical = true;
  winRect.addControl(winPanel);

  const winText = new TextBlock();
  winText.text = "YOU WIN";
  winText.height = "60px";
  winText.color = TRON_CYAN;
  winText.fontSize = 36;
  winText.fontFamily = "Courier New";
  winPanel.addControl(winText);

  const winRestartText = new TextBlock();
  winRestartText.text = "[ PRESS R TO RESTART ]";
  winRestartText.height = "40px";
  winRestartText.color = TRON_DIM;
  winRestartText.fontSize = 16;
  winRestartText.fontFamily = "Courier New";
  winPanel.addControl(winRestartText);

  // ── Suscripciones ──
  let shotCount = 0;
  const eventManager = EventManager.getInstance();

  const shotObserver = eventManager.subscribe((event: GameEvent) => {
    if (event.type === "projectile_fired" && event.source === "player") {
      shotCount++;
      shotText.text = `SHOTS  ${shotCount}`;
    }
  });

  // ── Controles públicos ──
  const updateLives = (lives: number): void => {
    const filled = "⬡ ".repeat(lives).trim();
    const empty = "⬢ ".repeat(Math.max(0, 5 - lives)).trim();
    livesText.text = filled + (empty ? `  ${empty}` : "");
    livesText.color = lives <= 2 ? TRON_RED : TRON_CYAN;
  };

  const updateEnemiesDown = (down: number, total: number): void => {
    enemiesText.text = `ENEMIES DOWN  ${down} / ${total}`;
    enemiesText.color = down === total ? TRON_CYAN : TRON_DIM;
  };

  const showGameOver = (): void => {
    gameOverRect.isVisible = true;
  };

  const showWin = (): void => {
    winRect.isVisible = true;
  }

  const dispose = (): void => {
    eventManager.unsubscribe(shotObserver);
    ui.dispose();
  };

  return { updateLives, updateEnemiesDown, showGameOver, showWin, dispose };
};