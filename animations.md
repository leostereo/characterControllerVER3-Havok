// import { AnimationGroup, Scene } from "@babylonjs/core";

// export enum AnimationEnums {
//     idle = "IDLE",
//     walk = "WALK",
//     walking_backwards = "WALKING_BACKWARDS",
//     run = "RUN",
//     run_fast = "RUN_FAST",
//     jump = "JUMP",
//     run_jump = "RUN_JUMP",
//     throw_freesbe = "THROW_FREESBE",
//     falling_flat = "IS_FALLING_FLAT",
//     falling_impact = "IS_FALLING_FLAT_IMPACT",
//     falling_idle = "IS_FALLING_IDLE",
//     cross_punch = "CROSS_PUNCH",
//     landing_from_jump = "LANDING_FROM_JUMP",
//     baseball_pitch = "BASEBALL_PITCH",
//     sprinting_roll = "SPRINTING_ROLL",
//     death_from_back_headshoot = "DEATH_FROM_BACK_HEADSHOOT",
//     head_hit = "HEAD_HIT",
//     dying = 'DYING',
//     has_won = 'HAS_WON',
//     right_turn = 'RIGHT_TURN',
//     left_turn = 'LEFT_TURN',
//     crouch = 'CROUCH',
//     crouched_throw = 'CROUCHED_THROW'
// }


// export type AnimationPlayControllOptions = {
//     mustLoop: boolean;
//     speedRatio: number;
//     from: number;
//     to: number
//     isAdditive: boolean;
// }

// export type CharacterAnimationItem = {
//     animation: AnimationGroup;
//     name: AnimationEnums;
//     latched: boolean;
//     currentlyPlay: boolean;
//     control?: AnimationPlayControllOptions;
// }

// export class CharacterAnimationContainer {

//     private TURNING_IN_PLACE_RATIO = 2.5;

//     private characterAnimationGroup: AnimationGroup[];
//     private characterAnimationVector: CharacterAnimationItem[] = [];
//     private scene: Scene;
//     private prefix: string;

//     constructor(prefix: string | undefined, scene: Scene, animationGroup?: AnimationGroup[]) {
//         if (animationGroup) {
//             this.characterAnimationGroup = animationGroup;
//         }

//         if(!prefix){
//             this.prefix = '';
//         }
//         this.scene = scene;
//         this.characterAnimationVectorInit();
//     }

//     private characterAnimationVectorInit() {

//         const idleAnimation = this.scene.getAnimationGroupByName(`${this.prefix}idle`)
//         if (idleAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: idleAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.idle
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const walkAnimation = this.scene.getAnimationGroupByName(`${this.prefix}walking`)
//         if (walkAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: walkAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.walk
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const runAnimation = this.scene.getAnimationGroupByName(`${this.prefix}slow running`)
//         if (runAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: runAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.run
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const runFastAnimation = this.scene.getAnimationGroupByName(`${this.prefix}fast running`)
//         if (runFastAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: runFastAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.run_fast
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const freesbeAnimation = this.scene.getAnimationGroupByName(`${this.prefix}fresbe throw`)
//         if (freesbeAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: freesbeAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.throw_freesbe,
//                 control: {
//                     from: 50,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 2.2,
//                     to: 160
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const fallingIdleAnimation = this.scene.getAnimationGroupByName(`${this.prefix}falling idle`)
//         if (fallingIdleAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: fallingIdleAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.falling_idle
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const fallingFlatAnimation = this.scene.getAnimationGroupByName(`${this.prefix}falling impact`)
//         if (fallingFlatAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: fallingFlatAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.falling_flat
//             }
//             this.characterAnimationVector.push(animationItem);
//         }
//         const fallingFlatImpactAnimation = this.scene.getAnimationGroupByName(`${this.prefix}falling flat impact`)
//         if (fallingFlatImpactAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: fallingFlatImpactAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.falling_impact,
//                 control: {
//                     from: 20,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 1,
//                     to: 95
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const crossPunchAnimation = this.scene.getAnimationGroupByName(`${this.prefix}cross punch`)
//         if (crossPunchAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: crossPunchAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.cross_punch,
//                 control: {
//                     from: 1,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 1.6,
//                     to: 122
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }
//         const jumpUpAnimation = this.scene.getAnimationGroupByName(`${this.prefix}jump up`)
//         if (jumpUpAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: jumpUpAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.jump,
//                 control: {
//                     from: 15,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 1.8,
//                     to: 45
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const jumpAndRunAnimation = this.scene.getAnimationGroupByName(`${this.prefix}running and jump`)
//         if (jumpAndRunAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: jumpAndRunAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.run_jump,
//                 control: {
//                     from: 1,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 1.2,
//                     to: 62
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const landingFromJumpAnimation = this.scene.getAnimationGroupByName(`${this.prefix}landing`)
//         if (landingFromJumpAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: landingFromJumpAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.landing_from_jump,
//                 control: {
//                     from: 38,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 2.2,
//                     to: 70
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const baseBallPitchJumpAnimation = this.scene.getAnimationGroupByName(`${this.prefix}baseball pitch`)
//         if (baseBallPitchJumpAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: baseBallPitchJumpAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.baseball_pitch,
//                 control: {
//                     from: 90,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 2.4,
//                     to: 140
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const sptrintingRollAnimation = this.scene.getAnimationGroupByName(`${this.prefix}sprinting roll`)
//         if (sptrintingRollAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: sptrintingRollAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.sprinting_roll,
//                 control: {
//                     from: 1,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 2.4,
//                     to: 72
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const deathFromBackHeadshootAnimation = this.scene.getAnimationGroupByName(`${this.prefix}death from back headshoot`)
//         if (deathFromBackHeadshootAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: deathFromBackHeadshootAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.death_from_back_headshoot,
//                 control: {
//                     from: 10,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 2.4,
//                     to: 200
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const headHitAnimation = this.scene.getAnimationGroupByName(`${this.prefix}head hit`)
//         if (headHitAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: headHitAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.head_hit,
//                 control: {
//                     from: 5,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 1.8,
//                     to: 60
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const dyingAnimation = this.scene.getAnimationGroupByName(`${this.prefix}dying`)
//         if (dyingAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: dyingAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.dying,
//                 control: {
//                     from: 1,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 1.8,
//                     to: 158
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const victoryAnimation = this.scene.getAnimationGroupByName(`${this.prefix}victory`)
//         if (victoryAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: victoryAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.has_won,
//                 control: {
//                     from: 1,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 1.8,
//                     to: 272
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }
        
//         const walkingBackwardsAnimation = this.scene.getAnimationGroupByName(`${this.prefix}walking backwards`)
//         if (walkingBackwardsAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: walkingBackwardsAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.walking_backwards
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const rightTurnAnimation = this.scene.getAnimationGroupByName(`${this.prefix}right turn`)
//         if (rightTurnAnimation) {
//             rightTurnAnimation.speedRatio = this.TURNING_IN_PLACE_RATIO;
//             let animationItem: CharacterAnimationItem = {
//                 animation: rightTurnAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.right_turn
//             }
//             this.characterAnimationVector.push(animationItem);
//         }
        
//         const leftTurnAnimation = this.scene.getAnimationGroupByName(`${this.prefix}left turn`)
//         if (leftTurnAnimation) {
//             leftTurnAnimation.speedRatio = this.TURNING_IN_PLACE_RATIO;
//             let animationItem: CharacterAnimationItem = {
//                 animation: leftTurnAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.left_turn
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const crouchAnimation = this.scene.getAnimationGroupByName(`${this.prefix}crouching`)
//         if (crouchAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: crouchAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.crouch,
//                 control: {
//                     from: 50,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 1.8,
//                     to: 165
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }

//         const crouchedThrowAnimation = this.scene.getAnimationGroupByName(`${this.prefix}crounched throw`)
//         if (crouchedThrowAnimation) {
//             let animationItem: CharacterAnimationItem = {
//                 animation: crouchedThrowAnimation,
//                 latched: false,
//                 currentlyPlay: false,
//                 name: AnimationEnums.crouched_throw,
//                 control: {
//                     from: 120,
//                     isAdditive: false,
//                     mustLoop: false,
//                     speedRatio: 1.8,
//                     to: 290
//                 }
//             }
//             this.characterAnimationVector.push(animationItem);
//         }
//     }

//     public getCurrentPlayingAnimation() {
//         return this.characterAnimationVector.find((item) => item.animation.isPlaying)
//     }

//     public getAnimationByName(name: AnimationEnums): CharacterAnimationItem {
//         const animationItem = this.characterAnimationVector.find((animation) => animation.name === name) as CharacterAnimationItem
//         return animationItem;
//     }

//     public isAnyAnimationLatched(): boolean {
//         return this.characterAnimationVector.some((animation) => animation.latched);
//     }

//     public getLatchedAnimation(): CharacterAnimationItem | null {
//         return this.characterAnimationVector.find((animation) => animation.latched) ?? null;
//     }

//     public clearAllLatch(): void {
//         const latchedAnimation = this.characterAnimationVector.filter((animation) => animation.latched);
//         latchedAnimation.forEach(animation => {
//             animation.latched = false;
//         });
//     }

// }