import type { AnimationGroup } from "@babylonjs/core";
import type { PlayerController } from "./PlayerController";

type AnimState = "idle" | "walk" | "run" | "jump" | "fall" | "walk_back";

export class PlayerAnimationController {
  private current: AnimState = "idle";
  private groups: Record<AnimState, AnimationGroup | undefined> = {
    idle: undefined,
    walk: undefined,
    run: undefined,
    jump: undefined,
    fall: undefined,
    walk_back: undefined
  };

  constructor(private player: PlayerController) { }

  /**
   * Establece los grupos de animación y los mapea por nombre.
   */
  setAnimationGroups(animationGroups: AnimationGroup[]): void {

    this.groups.idle = animationGroups.find((item)=>item.name === 'idle');
    this.groups.walk = animationGroups.find((item)=>item.name === 'walking');
    this.groups.walk_back = animationGroups.find((item)=>item.name === 'walking backwards');
    this.groups.run = animationGroups.find((item)=>item.name === 'slow running');
    console.warn("Animation groups set:", Object.keys(this.groups).filter(k => this.groups[k as AnimState]));
  }

  update(): void {
    let next: AnimState = "idle";

    if (!this.player.isGrounded) {
      next = this.player.velocity.y > 0 ? "jump" : "fall";
    } else if (this.player.speed > 1) {
      
      if(this.player.isGoingBack === false){
        next = this.player.isRunning ? "run" : "walk";
      }
      if(this.player.isGoingBack){
        next = 'walk_back';
      }
    }

    this.play(next);
  }

  private play(state: AnimState): void {
    if (this.current === state) return;
    this.current = state;

    // Detener todas las animaciones
    Object.values(this.groups).forEach((g) => {
      if (g?.isPlaying) {
        g.stop();
      }
    });

    // Reproducir la animación correspondiente
    const group = this.groups[state] ?? this.groups.idle;
    if (group) group.start(true, 1.0, group.from, group.to, true);
  }
}