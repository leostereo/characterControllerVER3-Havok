// src/debug/CyborgDebugGUI.ts

import {
  type Scene,
  type Observer,
} from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  StackPanel,
  TextBlock,
  Rectangle,
  Control,
} from "@babylonjs/gui/2D";
import type { ICyborgStateMachine } from "@/enemies/interfaces/ICyborgStateMachine";
import { type CyborgState } from "@/enemies/cyborg/CyborgFSM";

const TRON_CYAN   = "#00E5CC";
const TRON_AMBER  = "#FFB300";
const TRON_RED    = "#FF2D55";
const TRON_DIM    = "#4B6B6B";

const STATE_COLORS: Partial<Record<CyborgState, string>> = {
  patrolling:           TRON_CYAN,
  shooting:             TRON_RED,
  searching:            TRON_AMBER,
  intensiveSearch:      "#FF6600",
  hit_reaction_back:    "#FF44AA",
  hit_reaction_forward: "#FF44AA",
  hit_reaction_left:    "#FF44AA",
  hit_reaction_right:   "#FF44AA",
  defeated:             "#666666",
  paused:               TRON_DIM,
};

export class CyborgDebugGUI {

  private ui:             AdvancedDynamicTexture;
  private stateText:      TextBlock;
  private triggerText:    TextBlock;
  private healthText:     TextBlock;
  private timeText:       TextBlock;
  private timerText:      TextBlock;
  private logPanel:       StackPanel;
  private renderObserver: Observer<Scene> | null = null;

  private stateElapsed    = 0;
  private lastState:      CyborgState | null = null;

  constructor(
    private scene: Scene,
    private fsm:   ICyborgStateMachine,
  ) {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI("cyborg_debug_ui");
    this.buildPanel();
    this.startLoop();
  }

  // ─────────────────────────────────────────────
  //  BUILD
  // ─────────────────────────────────────────────
  private buildPanel(): void {
    // ── panel principal — esquina superior derecha ──
    const bg                    = new Rectangle();
    bg.width                    = "280px";
    bg.height                   = "280px";
    bg.background               = "#00000099";
    bg.color                    = TRON_CYAN;
    bg.thickness                = 1;
    bg.cornerRadius             = 6;
    bg.verticalAlignment        = Control.VERTICAL_ALIGNMENT_TOP;
    bg.horizontalAlignment      = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    bg.topInPixels              = 20;
    bg.paddingRightInPixels     = 20;
    this.ui.addControl(bg);

    const panel      = new StackPanel();
    panel.isVertical = true;
    panel.paddingTopInPixels    = 10;
    panel.paddingLeftInPixels   = 10;
    panel.paddingRightInPixels  = 10;
    bg.addControl(panel);

    // título
    const title        = new TextBlock();
    title.text         = "── CYBORG DEBUG ──";
    title.height       = "24px";
    title.color        = TRON_CYAN;
    title.fontSize     = 13;
    title.fontFamily   = "Courier New";
    panel.addControl(title);

    // estado
    this.stateText         = this.makeRow(panel, "STATE:    --");
    this.triggerText       = this.makeRow(panel, "FROM:     --");
    this.healthText        = this.makeRow(panel, "HEALTH:   --");
    this.timeText          = this.makeRow(panel, "IN STATE: 0.0s");
    this.timerText         = this.makeRow(panel, "TIMER:    --");

    // separador
    const sep        = new TextBlock();
    sep.text         = "── LOG ──────────────";
    sep.height       = "20px";
    sep.color        = TRON_DIM;
    sep.fontSize     = 11;
    sep.fontFamily   = "Courier New";
    panel.addControl(sep);

    // log panel
    this.logPanel              = new StackPanel();
    this.logPanel.isVertical   = true;
    this.logPanel.height       = "100px";
    panel.addControl(this.logPanel);
  }

  private makeRow(parent: StackPanel, text: string): TextBlock {
    const row        = new TextBlock();
    row.text         = text;
    row.height       = "22px";
    row.color        = TRON_CYAN;
    row.fontSize     = 12;
    row.fontFamily   = "Courier New";
    row.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    parent.addControl(row);
    return row;
  }

  // ─────────────────────────────────────────────
  //  LOOP
  // ─────────────────────────────────────────────
  private startLoop(): void {
    this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
      const dt    = this.scene.getEngine().getDeltaTime();
      const state = this.fsm.getState();
      const health = this.fsm.getHealth();

      // detectar cambio de estado
      if (state !== this.lastState) {
        if (this.lastState !== null) {
          this.addLog(`${this.lastState} → ${state}`);
        }
        this.stateElapsed = 0;
        this.lastState    = state;
        this.stateText.color = STATE_COLORS[state] ?? TRON_CYAN;
      }

      this.stateElapsed += dt;

      // actualizar textos
      this.stateText.text   = `STATE:    ${state}`;
     // this.healthText.text  = `HEALTH:   ${"█".repeat(health)}${"░".repeat(3 - health)}`;
      this.timeText.text    = `IN STATE: ${(this.stateElapsed / 1000).toFixed(1)}s`;
      this.healthText.color = health <= 1 ? TRON_RED : TRON_CYAN;

      // timer intensiveSearch
      if (state === "intensiveSearch") {
        this.timerText.color = TRON_AMBER;
        this.timerText.text  = `TIMER:    activo`;
      } else {
        this.timerText.color = TRON_DIM;
        this.timerText.text  = `TIMER:    --`;
      }
    });
  }

  // ─────────────────────────────────────────────
  //  LOG
  // ─────────────────────────────────────────────
  private addLog(message: string): void {
    const line           = new TextBlock();
    line.text            = `> ${message}`;
    line.height          = "18px";
    line.color           = TRON_DIM;
    line.fontSize        = 11;
    line.fontFamily      = "Courier New";
    line.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.logPanel.addControl(line);

    // mantener solo las últimas 4 líneas
    const children = this.logPanel.children;
    if (children.length > 4) {
      this.logPanel.removeControl(children[0]);
    }
  }

  // ─────────────────────────────────────────────
  //  DISPOSE
  // ─────────────────────────────────────────────
  dispose(): void {
    if (this.renderObserver) {
      this.scene.onBeforeRenderObservable.remove(this.renderObserver);
    }
    this.ui.dispose();
  }
}