import { type AnimationGroup, AnimationEvent } from "@babylonjs/core";
import { type AnimationStateValue, type AnimationStateMachine } from "../statemachines/AnimationState";

export class AnimationGroupsManager {
    public groups: Record<AnimationStateValue, AnimationGroup | undefined> = {
        idle: undefined,
        walking: undefined,
        running: undefined,
        jump_impulse_starts: undefined,
        jump_impulse_is_over: undefined,
        jumping: undefined,
        falling_down: undefined,
        landing_safety: undefined,
        falling_to_crash: undefined,
        crashing_flat: undefined,
        walking_backwards: undefined,
        throwing: undefined,
        throwing_impulse_is_over: undefined,
        air_throwing: undefined,
        air_throwing_impulse_is_over: undefined,
        standing_to_crunch: undefined,
        crunch_idle: undefined,
        crouched_to_standing: undefined,
        rolling: undefined,
        impact_force_applied: undefined,
        impact_recibed: undefined,
        none: undefined
    };

    constructor(animationGroups: AnimationGroup[], private animationState: AnimationStateMachine) {
        this.stopAllAnimations(animationGroups);
        this.mapAnimationGroups(animationGroups);
        this.disposeUnusedAnimations(animationGroups);
    }

    private stopAllAnimations(animationGroups: AnimationGroup[]): void {
        animationGroups.forEach((ag: AnimationGroup) => ag.stop());
    }

    private mapAnimationGroups(animationGroups: AnimationGroup[]): void {
        this.groups.idle = animationGroups.find((item) => item.name === "idle");
        this.groups.walking = animationGroups.find((item) => item.name === "walking");
        this.groups.walking_backwards = animationGroups.find((item) => item.name === "walking backwards");
        this.groups.running = animationGroups.find((item) => item.name === "slow running");

        // Jump
        this.groups.jumping = animationGroups.find((item) => item.name === "falling idle");
        this.groups.falling_down = animationGroups.find((item) => item.name === "fall a loop");
        this.groups.falling_to_crash = animationGroups.find((item) => item.name === "falling impact");

        // Land-crash
        this.groups.crashing_flat = animationGroups.find((item) => item.name === "falling flat impact");
        if (this.groups.crashing_flat) {
            this.groups.crashing_flat.onAnimationGroupLoopObservable.add(() => {
                this.animationState.blockingAnimationIsPlaying = false;
            });
            this.groups.crashing_flat.from = 20;
        }

        // Safety landing
        const landing_event = new AnimationEvent(60, () => {
            this.animationState.blockingAnimationIsPlaying = false;
        }, true);
        this.groups.landing_safety = animationGroups.find((item) => item.name === "falling to landing");
        if (this.groups.landing_safety) {
            this.groups.landing_safety.from = 20;
            this.groups.landing_safety.to = 65;
            this.groups.landing_safety.speedRatio = 1.5;
        }
        const landing_anim = this.groups.landing_safety?.targetedAnimations[0].animation;
        landing_anim?.addEvent(landing_event);

        // Jumping impulse start and over
        const event = new AnimationEvent(30, () => {
            this.animationState.blockingAnimationIsPlaying = false;
            this.animationState.current = "jump_impulse_is_over";
        }, true);
        this.groups.jump_impulse_starts = animationGroups.find((item) => item.name === "jumping");
        if (this.groups.jump_impulse_starts) {
            this.groups.jump_impulse_starts.speedRatio = 1.5;
        }
        const anim = this.groups.jump_impulse_starts?.targetedAnimations[0].animation;
        anim?.addEvent(event);

        this.groups.jump_impulse_is_over = this.groups.jumping;

        //throwing
        this.groups.throwing = animationGroups.find((item) => item.name === 'fresbe throw');
        const throwing_event = new AnimationEvent(85, () => {
            this.animationState.current = "throwing_impulse_is_over";

        }, true);
        const throwing_event_finish = new AnimationEvent(150, () => {
            this.animationState.blockingAnimationIsPlaying = false;

        }, true);
        if (this.groups.throwing) {
            this.groups.throwing.from = 50;
            this.groups.throwing.to = 160;
            this.groups.throwing.speedRatio = 2;
        }
        const throw_anim = this.groups.throwing?.targetedAnimations[0].animation;
        throw_anim?.addEvent(throwing_event);
        throw_anim?.addEvent(throwing_event_finish);
        this.groups.throwing_impulse_is_over = this.groups.throwing;


        //air throwing
        this.groups.air_throwing = animationGroups.find((item) => item.name === 'baseball pitch');
        const air_throwing_event = new AnimationEvent(125, () => {
            this.animationState.setState('air_throwing_impulse_is_over')
        }, true);
        const air_throwing_event_finish = new AnimationEvent(135, () => {
            this.animationState.blockingAnimationIsPlaying = false;
        }, true);
        if (this.groups.air_throwing) {
            this.groups.air_throwing.from = 90;
            this.groups.air_throwing.to = 140;
            this.groups.air_throwing.speedRatio = 2;
        }
        const air_throw_anim = this.groups.air_throwing?.targetedAnimations[0].animation;
        air_throw_anim?.addEvent(air_throwing_event);
        air_throw_anim?.addEvent(air_throwing_event_finish);
        this.groups.air_throwing_impulse_is_over = this.groups.air_throwing;

        //Rolling
        this.groups.rolling = animationGroups.find((item) => item.name === 'sprinting roll');
        const rolling_finish_event = new AnimationEvent(70, () => {
            this.animationState.blockingAnimationIsPlaying = false;
        }, true);
        if (this.groups.rolling) {
            this.groups.rolling.speedRatio = 2;
        }
        const rolling_anim = this.groups.rolling?.targetedAnimations[0].animation;
        rolling_anim?.addEvent(rolling_finish_event)

        //Crunch
        this.groups.crunch_idle = animationGroups.find((item) => item.name === 'crouching idle');

        this.groups.standing_to_crunch = animationGroups.find((item) => item.name === 'standing to crouch');
        const standing_to_crunch_finish_event = new AnimationEvent(38, () => {
            this.animationState.blockingAnimationIsPlaying = false;
        }, true);
        if (this.groups.standing_to_crunch) {
            this.groups.standing_to_crunch.speedRatio = 2;
        }
        const standing_to_crunch_anim = this.groups.standing_to_crunch?.targetedAnimations[0].animation;
        standing_to_crunch_anim?.addEvent(standing_to_crunch_finish_event)

        this.groups.crouched_to_standing = animationGroups.find((item) => item.name === 'crouched to standing');
        const crouched_to_standing_finish_event = new AnimationEvent(38, () => {
            this.animationState.blockingAnimationIsPlaying = false;
        }, true);
        if (this.groups.crouched_to_standing) {
            this.groups.crouched_to_standing.speedRatio = 2;
        }
        const crounched_to_standing_anim = this.groups.crouched_to_standing?.targetedAnimations[0].animation;
        crounched_to_standing_anim?.addEvent(crouched_to_standing_finish_event)
        
        
        //projectile hit
        this.groups.impact_recibed = animationGroups.find((item) => item.name === 'head hit');
        const impact_recibed_finish_event = new AnimationEvent(80, () => {
            this.animationState.blockingAnimationIsPlaying = false;
        }, true);
        if (this.groups.impact_recibed) {
            this.groups.impact_recibed.speedRatio = 1.2;
        }
        const impact_recibed_anim = this.groups.impact_recibed?.targetedAnimations[0].animation;
        impact_recibed_anim?.addEvent(impact_recibed_finish_event)

        //
        console.warn("Animation groups set:", Object.keys(this.groups).filter(k => this.groups[k as AnimationStateValue]));
    }

    private disposeUnusedAnimations(animationGroups: AnimationGroup[]): void {
        const usedGroups = new Set<AnimationGroup>(
            Object.values(this.groups).filter((group): group is AnimationGroup => group !== undefined)
        );

        animationGroups.forEach((group) => {
            if (!usedGroups.has(group)) {
                group.dispose();
            }
        });
    }
}