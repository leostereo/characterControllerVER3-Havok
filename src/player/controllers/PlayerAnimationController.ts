import { AnimationGroup } from "@babylonjs/core";
import { PlayerController } from "./PlayerController";

type AnimState = "idle" | "walk" | "run" | "jump" | "fall";

export class PlayerAnimationController {
  private current: AnimState = "idle";
  private groups: Record<AnimState, AnimationGroup | undefined> = {
    idle: undefined,
    walk: undefined,
    run: undefined,
    jump: undefined,
    fall: undefined,
  };

  constructor(private player: PlayerController) {
    for (const g of player.animationGroups) {
      const n = g.name.toLowerCase();
      if (n.includes("idle")) this.groups.idle = g;
      else if (n.includes("walk")) this.groups.walk = g;
      else if (n.includes("run")) this.groups.run = g;
      else if (n.includes("jump")) this.groups.jump = g;
      else if (n.includes("fall")) this.groups.fall = g;
    }
  }

  update(): void {
    let next: AnimState = "idle";

    if (!this.player.isGrounded) {
      next = this.player.velocity.y > 0 ? "jump" : "fall";
    } else if (this.player.speed > 0.1) {
      next = this.player.isRunning ? "run" : "walk";
    }

    this.play(next);
  }

  private play(state: AnimState): void {
    if (this.current === state) return;
    this.current = state;
    this.player.animationGroups.forEach((g) => g.stop());

    const group = this.groups[state] ?? this.groups.idle;
    if (group) group.start(true, 1.0, group.from, group.to, true);
  }
}