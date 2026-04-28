import {
  type Scene,
  type Mesh,
  type TransformNode,
  type Observer,
  Vector3,
  Ray,
} from "@babylonjs/core";
import { meshNames, playerConfig, enemiesConfig } from "@/config/GameConfig";
import { type CanionStateMachine } from "../stateMachines/CanionStateMachine";

export class CanionController {

  private readonly AIM_HEIGHT_MULT = enemiesConfig.canion.aimHeightMult;
  private readonly CHARACTER_HEIGHT = playerConfig.height;
  private readonly SEARCH_ROTATE_SPEED = enemiesConfig.canion.searchRotateSpeed;

  private renderObserver: Observer<Scene> | null = null;

  constructor(
    private scene: Scene,
    private muzzleMesh: Mesh,
    private barrelPivot: TransformNode,
    private stateMachine: CanionStateMachine,
    private meshToShootName: string,
  ) { }

  // ─────────────────────────────────────────────
  //  CICLO DE VIDA
  // ─────────────────────────────────────────────
  start(): void {
    this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
      if (this.stateMachine.isDestroyed()) return;

      const dt = this.scene.getEngine().getDeltaTime();
      const playerInSight = this.hasLineOfSight();

      if (playerInSight) {
        this.trackTarget();
        this.stateMachine.setState("alert");
      } else {
        this.sweep(dt);
        this.stateMachine.setState("searching");
      }
    });
  }

  stop(): void {
    if (this.renderObserver) {
      this.scene.onBeforeRenderObservable.remove(this.renderObserver);
      this.renderObserver = null;
    }
  }

  // ─────────────────────────────────────────────
  //  RAYCAST
  // ─────────────────────────────────────────────
  private hasLineOfSight(): boolean {
    const target = this.scene.getMeshByName(this.meshToShootName);
    if (!target) return false;

    const aimHeight = this.CHARACTER_HEIGHT * this.AIM_HEIGHT_MULT;
    const aimTarget = target.position.add(new Vector3(0, aimHeight, 0));
    const origin = this.muzzleMesh.getAbsolutePosition();
    const direction = aimTarget.subtract(origin).normalize();
    const distance = Vector3.Distance(origin, aimTarget);

    const ray = new Ray(origin, direction, distance);
    const hit = this.scene.pickWithRay(ray, (mesh) =>
      !mesh.name.startsWith(meshNames.canionMuzzle) &&
      !mesh.name.startsWith(meshNames.canionBarrel) &&
      !mesh.name.startsWith(meshNames.canionPivot) &&
      !mesh.name.startsWith(meshNames.projectile)
    );

    return hit?.pickedMesh?.name === playerConfig.player1.player1Raycast;
  }

  // ─────────────────────────────────────────────
  //  MOVIMIENTO
  // ─────────────────────────────────────────────
  private trackTarget(): void {
    const target = this.scene.getMeshByName(this.meshToShootName);
    if (!target) return;

    const aimHeight = this.CHARACTER_HEIGHT * this.AIM_HEIGHT_MULT;
    const aimTarget = target.position.add(new Vector3(0, aimHeight, 0));
    const origin = this.muzzleMesh.getAbsolutePosition();
    const direction = aimTarget.subtract(origin).normalize();

    const angle = Math.atan2(direction.x, direction.z);
    this.barrelPivot.rotation.y = angle;
  }

  private sweep(dt: number): void {
    this.barrelPivot.rotation.y += this.SEARCH_ROTATE_SPEED * (dt / 1000);
  }

  // ─────────────────────────────────────────────
  //  API PÚBLICA — usada por CanionManager al disparar
  // ─────────────────────────────────────────────
  getMuzzlePositionAndDirection(): { origin: Vector3; direction: Vector3 } | null {
    const target = this.scene.getMeshByName(this.meshToShootName);
    if (!target) return null;

    const aimHeight = this.CHARACTER_HEIGHT * this.AIM_HEIGHT_MULT;
    const aimTarget = target.position.add(new Vector3(0, aimHeight, 0));
    const origin = this.muzzleMesh.getAbsolutePosition();
    const direction = aimTarget.subtract(origin).normalize();

    return { origin, direction };
  }
}