import {
  type Scene,
  Mesh,
  type TransformNode,
  type Observer,
  Vector3,
  Color3,
  Ray,
  StandardMaterial,
  MeshBuilder,
} from "@babylonjs/core";
import { type SurveillanceStateMachine, type SurveillanceState } from "../statemachines/SurveillanceStateMachine";
import { meshNames, playerConfig, surveillanceConfig } from "@/config/GameConfig";

export class SurveillanceController {

  private readonly SEARCH_ROTATE_SPEED = surveillanceConfig.searchRotateSpeed;
  private readonly DETECTION_RANGE = surveillanceConfig.detection.range;
  private readonly DETECTION_ANGLE_RAD = (surveillanceConfig.detection.angle * Math.PI) / 180;
  private readonly TRACKING_RATE = surveillanceConfig.trackingRate;

  private renderObserver: Observer<Scene> | null = null;
  private trackingElapsed = 0;
  private visionCone: Mesh;

  constructor(
    private scene: Scene,
    private barrel: Mesh,
    private rotationPivot: TransformNode,
    private stateMachine: SurveillanceStateMachine,
    private meshForPositionTrackName: string,
    private meshForRayCastDetectionName: string,
    private sweepDirection: 1 | -1 = 1,
  ) {
    this.visionCone = this.buildVisionCone();
    this.stateMachine.onStateChange((state) => this.updateConeColor(state));
  }

  // ─────────────────────────────────────────────
  //  CICLO DE VIDA
  // ─────────────────────────────────────────────
  start(): void {
    this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
      if (this.stateMachine.isCollapsed()) return;

      const dt = this.scene.getEngine().getDeltaTime();
      const playerInSight = this.hasLineOfSight();

      if (playerInSight) {
        this.stateMachine.setState("alert");
        this.trackingElapsed += dt;
        if (this.trackingElapsed >= this.TRACKING_RATE) {
          this.trackingElapsed = 0;
          this.trackTarget();
        }
      } else {
        this.trackingElapsed = 0;
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

  dispose(): void {
    this.stop();
    this.visionCone.dispose();
  }

  // ─────────────────────────────────────────────
  //  DETECCIÓN — ángulo + distancia + raycast
  // ─────────────────────────────────────────────
  private hasLineOfSight(): boolean {
    const target = this.scene.getMeshByName(this.meshForPositionTrackName);
    if (!target) return false;

    const origin = this.barrel.getAbsolutePosition();
    const forward = this.rotationPivot.forward.normalize();
    const toTarget = target.position.subtract(origin);
    const distance = toTarget.length();

    if (distance > this.DETECTION_RANGE) return false;

    const dirToTarget = toTarget.normalize();
    const dot = Vector3.Dot(forward, dirToTarget);
    const angleToTarget = Math.acos(Math.min(1, Math.max(-1, dot)));
    if (angleToTarget > this.DETECTION_ANGLE_RAD) return false;

    const rayOrigin = origin.clone();
    rayOrigin.y += 0.8;
    const ray = new Ray(rayOrigin, dirToTarget, distance);
    const hit = this.scene.pickWithRay(ray, (mesh) =>
      !mesh.name.startsWith("surveillance_") &&
      !mesh.name.startsWith(meshNames.projectile)
    );

    return hit?.pickedMesh?.name === this.meshForRayCastDetectionName;
  }

  // ─────────────────────────────────────────────
  //  TRACKING
  // ─────────────────────────────────────────────
  private trackTarget(): void {
    const target = this.scene.getMeshByName(this.meshForPositionTrackName);
    if (!target) return;

    const origin = this.barrel.getAbsolutePosition();
    const aimHeight = playerConfig.height * playerConfig.aimHeightMultiplier;
    const aimTarget = target.position.add(new Vector3(0, aimHeight, 0));
    const direction = aimTarget.subtract(origin).normalize();

    this.rotationPivot.rotation.y = Math.atan2(direction.x, direction.z);
    this.rotationPivot.rotation.x = -Math.asin(Math.min(1, Math.max(-1, direction.y)));
  }

  // ─────────────────────────────────────────────
  //  SWEEP
  // ─────────────────────────────────────────────
  private sweep(dt: number): void {
    this.rotationPivot.rotation.y +=
      this.SEARCH_ROTATE_SPEED * this.sweepDirection * (dt / 1000);
  }

  // ─────────────────────────────────────────────
  //  CONO DE VISIÓN
  // ─────────────────────────────────────────────
private buildVisionCone(): Mesh {
  const range      = this.DETECTION_RANGE;
  const coneRadius = range * Math.tan(this.DETECTION_ANGLE_RAD);

  // Ángulo de inclinación hacia abajo — apunta levemente al suelo
  const TILT = Math.PI / 6;  // 30° hacia abajo, tuneable

  const cone = MeshBuilder.CreateCylinder(
    `surveillance_cone_${this.rotationPivot.name}`,
    {
      diameterTop:     0,
      diameterBottom:  coneRadius * 2,
      height:          range,
      tessellation:    24,
      cap:             Mesh.NO_CAP,
      sideOrientation: Mesh.DOUBLESIDE,
    },
    this.scene
  );

  // ✅ Posicionar el centro del cono en dirección del eje inclinado
  // igual que en el playground — offset según cos/sin del tilt
  cone.position.z =  (range / 2) * Math.cos(TILT);  // adelante en Z
  cone.position.y = -(range / 2) * Math.sin(TILT);  // abajo en Y

  // Rotar para apuntar en Z+ con inclinación hacia abajo
  cone.rotation.x = -(Math.PI / 2) + TILT;

  cone.parent     = this.rotationPivot;
  cone.isPickable = false;

  const mat           = new StandardMaterial(`surveillance_cone_mat_${this.rotationPivot.name}`, this.scene);
  mat.diffuseColor    = new Color3(1.0, 0.9, 0.0);
  mat.emissiveColor   = new Color3(0.8, 0.7, 0.0);
  mat.alpha           = 0.12;
  mat.backFaceCulling = false;
  mat.disableLighting = true;
  cone.material       = mat;

  return cone;
}

  private updateConeColor(state: SurveillanceState): void {
    const mat = this.visionCone.material as StandardMaterial;
    if (!mat) return;

    switch (state) {
      case "searching":
        mat.diffuseColor = new Color3(1.0, 0.9, 0.0);
        mat.emissiveColor = new Color3(0.8, 0.7, 0.0);
        mat.alpha = 0.12;
        break;
      case "alert":
        mat.diffuseColor = new Color3(1.0, 0.1, 0.0);
        mat.emissiveColor = new Color3(0.8, 0.0, 0.0);
        mat.alpha = 0.20;
        break;
      case "collapsed":
        this.visionCone.setEnabled(false);
        break;
    }
  }

  // ─────────────────────────────────────────────
  //  API PÚBLICA
  // ─────────────────────────────────────────────
  getMuzzlePositionAndDirection(): { origin: Vector3; direction: Vector3 } | null {
    if (this.stateMachine.isCollapsed()) return null;
    return {
      origin: this.barrel.getAbsolutePosition(),
      direction: this.rotationPivot.forward.normalize(),
    };
  }
}