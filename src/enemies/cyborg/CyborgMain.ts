// src/enemies/cyborgV1/CyborgMain.ts

import {
    type Scene,
    type AbstractMesh,
    type AnimationGroup,
    type Vector3,
} from "@babylonjs/core";
import type { IBaseEnemy } from "../interfaces";
import { CyborgFSM } from "./CyborgFSM";
import { CyborgBody } from "./CyborgBody";

export class CyborgMain implements IBaseEnemy {

    private fsm: CyborgFSM;
    private body: CyborgBody;

    constructor(
        private scene: Scene,
        private uniqueId: string,
        rootMesh: AbstractMesh,
        animations: AnimationGroup[],
        position: Vector3,
    ) {
        this.fsm = new CyborgFSM();
        this.body = new CyborgBody(scene, this.fsm, rootMesh, animations, uniqueId);
        this.body.setPosition(position);
    }
    stop(): void {
        throw new Error("Method not implemented.");
    }

    start(): void {
        // por ahora solo reproduce idle via FSM
        this.fsm.setState("paused");   // ← paused → idle animation
    }

    dispose(): void {
        this.body.dispose();
        this.fsm.dispose();
    }
}