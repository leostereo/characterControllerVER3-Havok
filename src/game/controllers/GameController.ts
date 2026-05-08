import type { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { type GameStateMachine } from "../stateMachines/GameStateMachine";
import { GameState } from "../types/GameState";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";

export class GameController {
    constructor(
        private scene: Scene,
        private engine: Engine | WebGPUEngine,
        private stateMachine: GameStateMachine
    ) { }

    start(): void {
        console.warn("[GameController] activeCamera:", this.scene.activeCamera);
        if (this.stateMachine.transition(GameState.PLAYING)) {
            this.engine.runRenderLoop(() => this.scene.render());
        }
    }

    pause(): void {
        if (this.stateMachine.transition(GameState.PAUSED)) {
            this.engine.stopRenderLoop();
        }
    }

    resume(): void {
        if (this.stateMachine.transition(GameState.PLAYING)) {
            this.engine.runRenderLoop(() => this.scene.render());
        }
    }

    gameOver(): void {
        this.stateMachine.transition(GameState.GAME_OVER);
        this.engine.stopRenderLoop();
    }
}