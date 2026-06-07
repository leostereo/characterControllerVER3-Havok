// src/game/audio/SoundFXManager.ts

import { Sound, type Scene, type Observer } from "@babylonjs/core";
import { EventManager, type GameEvent } from "@/game/eventManager/eventManager";
import { soundConfig } from "@/config/GameConfig";

export type SoundFXEvent =
  | "player_impulse_to_jump"
  | "player_recibe_damage"
  | "player_going_death"
  | "projectile_against_player"
  | "projectile_against_playground"
  | "freesbe_against_metal"
  | "freesbe_woosh"
  | "enemy_collapsed";

const SOUND_REGISTRY: Record<SoundFXEvent, string[]> = {
  player_impulse_to_jump: ["player_impulse_to_jump_1", "player_impulse_to_jump_2"],
  player_recibe_damage: ["player_recibe_damage_1", "player_recibe_damage_2", "player_recibe_damage_3", "player_recibe_damage_4", "player_recibe_damage_5"],
  player_going_death: ["player_going_death_1", "player_going_death_2"],
  projectile_against_player: ["projectile_against_player_1"],
  projectile_against_playground: ["projectile_against_playground_1"],
  freesbe_against_metal: ["freesbe_against_metal_1", "freesbe_against_metal_2"],
  freesbe_woosh: ["freesbe_woosh_1"],
  enemy_collapsed: ["enemy_collapsed_1", "enemy_collapsed_2"],
};

export class SoundFXManager {

  private static instance: SoundFXManager | null = null;
  private sounds = new Map<SoundFXEvent, Sound[]>();
  private indices = new Map<SoundFXEvent, number>();
  private eventObserver: Observer<GameEvent> | null = null;

  private constructor(private scene: Scene) { }

  static getInstance(scene: Scene): SoundFXManager {
    return SoundFXManager.instance ??= new SoundFXManager(scene);
  }

  // ─────────────────────────────────────────────
  //  INICIALIZACIÓN
  // ─────────────────────────────────────────────
  init(binaries: { [key: string]: ArrayBuffer }): void {
    for (const [event, keys] of Object.entries(SOUND_REGISTRY) as [SoundFXEvent, string[]][]) {
      const loaded: Sound[] = [];

      keys.forEach(key => {
        const data = binaries[key];
        if (!data) {
          console.warn(`[SoundFXManager] Binary no encontrado: ${key}`);
          return;
        }

        const sound = new Sound(key, data, this.scene, null, {
          autoplay: false,
          loop: false,
          volume: soundConfig.volumes[event]
        });

        loaded.push(sound);
      });

      if (loaded.length > 0) {
        this.sounds.set(event, loaded);
        this.indices.set(event, 0);
      }
    }

    this.subscribeToEvents();
  }

  // ─────────────────────────────────────────────
  //  PLAY — round robin
  // ─────────────────────────────────────────────
  play(event: SoundFXEvent, skipIfPlaying = false): void {
    const sounds = this.sounds.get(event);
    if (!sounds || sounds.length === 0) return;

    const index = this.indices.get(event) ?? 0;
    const sound = sounds[index];

    if (skipIfPlaying && sound.isPlaying) return;  // ← solo si se pide

    sound.play();
    this.indices.set(event, (index + 1) % sounds.length);
  }

  // ─────────────────────────────────────────────
  //  SUSCRIPCIÓN A EVENTOS
  // ─────────────────────────────────────────────
  private subscribeToEvents(): void {
    const em = EventManager.getInstance();

    this.eventObserver = em.subscribe((event: GameEvent) => {
      switch (event.type) {
        case "projectile_hit":
          if (event.sourceType === "enemy") this.play("projectile_against_player");
          else this.play("freesbe_against_metal", true);  // ← skipIfPlaying = true
          break;
        case "player_damaged":
          this.play("player_recibe_damage");
          break;
        case "player_will_jump":
          this.play("player_impulse_to_jump");
          break;
        case "game_over":     //shoud use player_die here ... but no body emits that.
          this.play("player_going_death");
          break;
        case "enemy_destroyed":
          this.play("enemy_collapsed");
          break;
        case "projectile_fired":
          if (event.source === "player") this.play("freesbe_woosh");
          break;
      }
    });
  }

  // ─────────────────────────────────────────────
  //  DISPOSE
  // ─────────────────────────────────────────────
  dispose(): void {
    if (this.eventObserver) {
      EventManager.getInstance().unsubscribe(this.eventObserver);
      this.eventObserver = null;
    }
    this.sounds.forEach(arr => arr.forEach(s => s.dispose()));
    this.sounds.clear();
    this.indices.clear();
    SoundFXManager.instance = null;
  }
}