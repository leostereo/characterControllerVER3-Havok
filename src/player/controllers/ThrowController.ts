import { type Scene } from "@babylonjs/core";
import { type InputState } from "../statemachines/InputState";
import { type PhysicState } from "../statemachines/PhysicState";
import { type AnimationStateMachine } from "../statemachines/AnimationState";
import { type AnimationGroupsManager } from "../managers/AnimationGroupsManger";
import { FreesBeeManager } from "../managers/FreesBeeManager";
import { ParticlesManager } from "../managers/ParticlesManager";

export class ThrowController {

  private freesbeeManager:FreesBeeManager

  constructor(
    private scene: Scene,
    private physicState: PhysicState,
    private animationState: AnimationStateMachine,
    private particlesManager: ParticlesManager,
  ) {
    this.freesbeeManager = new FreesBeeManager(scene,particlesManager);
   }
  
  update(): void {
    
    if (this.animationState.current === 'throwing_impulse_is_over'){
      const {position,forward} = this.physicState.getThrowPArams()
      this.freesbeeManager.thowFreesbe(position,forward,false)
      this.animationState.setState('none');
    }

    if (this.animationState.current === 'air_throwing_impulse_is_over'){
      const {position,forward} = this.physicState.getThrowPArams()
      this.freesbeeManager.thowFreesbe(position,forward,true)
      this.animationState.setState('none');
    }
  }


}