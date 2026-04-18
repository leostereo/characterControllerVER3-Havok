import { Scene, type AnimationGroup } from "@babylonjs/core";
import { type InputState } from "../statemachines/InputState";
import { type PhysicState } from "../statemachines/PhysicState";
import { type AnimationStateValue, type AnimationStateMachine } from "../statemachines/AnimationState";
import { type AnimationGroupsManager } from "../managers/AnimationGroupsManger";
import { FreesBeeManager } from "../managers/FreesBeeManager";

export class ThrowController {

  ///TODO el disco sale muy rapido y bajo.
  // calibrar.
  //seguir trabajando en este branch mergear a main.

  private freesbeeManager:FreesBeeManager

  constructor(
    private scene: Scene,
    private inputState: InputState,
    private physicState: PhysicState,
    private animationState: AnimationStateMachine,
    private animationGroupsManager: AnimationGroupsManager  
  ) {
    this.freesbeeManager = new FreesBeeManager(scene);
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