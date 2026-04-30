import {
  type Scene,
  type Mesh,
  type TransformNode,
  type Observer,
  Vector3,
  SpotLight,
  Color3,
} from "@babylonjs/core";
import { type SurveillanceStateMachine, type SurveillanceState } from "../statemachines/SurveillanceStateMachine";
import { playerConfig, surveillanceConfig } from "@/config/GameConfig";

export class SurveillanceController {

  private readonly SEARCH_ROTATE_SPEED = surveillanceConfig.searchRotateSpeed;
  private readonly DETECTION_RANGE = surveillanceConfig.detection.range;
  private readonly DETECTION_ANGLE_RAD = (surveillanceConfig.detection.angle * Math.PI) / 180;
  private readonly LIGHT_INTENSITY_SEARCHING = surveillanceConfig.light.intensitySearching;
  private readonly LIGHT_INTENSITY_ALERT = surveillanceConfig.light.intensityAlert;
  private readonly TRACKING_RATE = surveillanceConfig.trackingRate;

  private renderObserver: Observer<Scene> | null = null;
  private spotLight: SpotLight;
  private trackingElapsed = 0;   // ← acumulador para el tracking

  constructor(
    private scene: Scene,
    private barrel: Mesh,
    private rotationPivot: TransformNode,
    private stateMachine: SurveillanceStateMachine,
    private meshToShootName: string,
  ) {
    this.spotLight = this.buildSpotLight();

    // Actualizar color de la luz cuando cambia el estado
    this.stateMachine.onStateChange((state) => this.updateLightColor(state));
  }

  // ─────────────────────────────────────────────
  //  CICLO DE VIDA
  // ─────────────────────────────────────────────
  start(): void {
    this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
      if (this.stateMachine.isCollapsed()) return;

      const dt = this.scene.getEngine().getDeltaTime();
      const playerInSight = this.hasLineOfSight();

      this.updateSpotLight();

      if (playerInSight) {
        this.stateMachine.setState("alert");

        // ✅ Recalcular posición del jugador cada TRACKING_RATE ms
        this.trackingElapsed += dt;
        if (this.trackingElapsed >= this.TRACKING_RATE) {
          this.trackingElapsed = 0;
          this.trackTarget();
        }

      } else {
        this.trackingElapsed = 0;   // resetear al salir del cono
        this.sweep(dt);
        this.stateMachine.setState("searching");
      }
    });
  }

  // ─────────────────────────────────────────────
  //  TRACKING — rota el pivot hacia el jugador
  // ─────────────────────────────────────────────
  private trackTarget(): void {
    const target = this.scene.getMeshByName(this.meshToShootName);
    if (!target) return;

    const origin = this.barrel.getAbsolutePosition();

    // Apuntar al centro de masa del jugador
    const aimHeight = playerConfig.height * playerConfig.aimHeightMultiplier;
    const aimTarget = target.position.add(new Vector3(0, aimHeight, 0));
    const direction = aimTarget.subtract(origin).normalize();

    // Ángulo horizontal
    const angleY = Math.atan2(direction.x, direction.z);
    this.rotationPivot.rotation.y = angleY;

    // ✅ Ángulo vertical — inclina el pivot hacia abajo para alcanzar al jugador
    const angleX = -Math.asin(Math.min(1, Math.max(-1, direction.y)));
    this.rotationPivot.rotation.x = angleX;
  }

  stop(): void {
    if (this.renderObserver) {
      this.scene.onBeforeRenderObservable.remove(this.renderObserver);
      this.renderObserver = null;
    }
    this.spotLight.setEnabled(false);
  }

  // ─────────────────────────────────────────────
  //  DETECCIÓN — ángulo + distancia
  // ─────────────────────────────────────────────
  private hasLineOfSight(): boolean {
    const target = this.scene.getMeshByName(this.meshToShootName);
    if (!target) return false;

    const origin = this.barrel.getAbsolutePosition();
    const forward = this.rotationPivot.forward.normalize();
    const toTarget = target.position.subtract(origin);
    const distance = toTarget.length();

    // 1. ¿Está dentro del rango?
    if (distance > this.DETECTION_RANGE) return false;


    // 2. ¿Está dentro del ángulo del cono?
    const dirToTarget = toTarget.normalize();
    const dot = Vector3.Dot(forward, dirToTarget);
    const angleToTarget = Math.acos(Math.min(1, Math.max(-1, dot)));

    return angleToTarget <= this.DETECTION_ANGLE_RAD;
  }

  // ─────────────────────────────────────────────
  //  SWEEP
  // ─────────────────────────────────────────────
  private sweep(dt: number): void {
    this.rotationPivot.rotation.y += this.SEARCH_ROTATE_SPEED * (dt / 1000);
  }

  // ─────────────────────────────────────────────
  //  SPOT LIGHT
  // ─────────────────────────────────────────────
  private buildSpotLight(): SpotLight {
    const light = new SpotLight(
      `surveillance_spot_${this.rotationPivot.name}`,
      this.barrel.getAbsolutePosition(),
      this.rotationPivot.forward.normalize(),
      this.DETECTION_ANGLE_RAD * 2,  // angle = cono completo
      2,                              // exponent — qué tan concentrado
      this.scene
    );
    light.diffuse = new Color3(1.0, 0.9, 0.0); // amarillo — searching
    light.intensity = 5;
    light.range = this.DETECTION_RANGE;
    return light;
  }

  private updateSpotLight(): void {
    this.spotLight.position = this.barrel.getAbsolutePosition();
    this.spotLight.direction = this.rotationPivot.forward.normalize();
  }

  // ─────────────────────────────────────────────
  //  LIGHT — intensidades desde config
  // ─────────────────────────────────────────────
  private updateLightColor(state: SurveillanceState): void {
    switch (state) {
      case "searching":
        this.spotLight.diffuse = new Color3(1.0, 0.9, 0.0);
        this.spotLight.intensity = this.LIGHT_INTENSITY_SEARCHING;
        break;
      case "alert":
        this.spotLight.diffuse = new Color3(1.0, 0.1, 0.0);
        this.spotLight.intensity = this.LIGHT_INTENSITY_ALERT;
        break;
      case "collapsed":
        this.spotLight.setEnabled(false);
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