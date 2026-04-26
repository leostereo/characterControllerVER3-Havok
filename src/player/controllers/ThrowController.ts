import { type Scene } from "@babylonjs/core";
import { type PhysicState } from "../statemachines/PhysicState";
import { type AnimationStateMachine } from "../statemachines/AnimationState";
import { FreesBeManager } from "../managers/FreesBeeManager";

export class ThrowController {

  private freesbeeManager: FreesBeManager

  constructor(
    private scene: Scene,
    private physicState: PhysicState,
    private animationState: AnimationStateMachine,
  ) {
    this.freesbeeManager = new FreesBeManager(scene);
  }

  update(): void {

    if (this.animationState.current === 'throwing_impulse_is_over') {
      const { position, forward } = this.physicState.getThrowPArams()
      this.freesbeeManager.throwFreesbe(position, forward, false)
      this.animationState.setState('none');
    }

    if (this.animationState.current === 'air_throwing_impulse_is_over') {
      const { position, forward } = this.physicState.getThrowPArams()
      this.freesbeeManager.throwFreesbe(position, forward, true)
      this.animationState.setState('none');
    }
  }


}