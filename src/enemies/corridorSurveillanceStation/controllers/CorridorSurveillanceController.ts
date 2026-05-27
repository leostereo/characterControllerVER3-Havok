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
import { type CorridorSurveillanceStateMachine, type CorridorSurveillanceState } from "../statemachines/CorridorSurveillanceStateMachine";
import { meshNames, playerConfig, superVisionConfig, surveillanceConfig } from "@/config/GameConfig";
import { type Area } from "@/playground/builders/BuildMap";

export class CorridorSurveillanceController {

  private readonly SEARCH_ROTATE_SPEED = surveillanceConfig.searchRotateSpeed;
  private readonly DETECTION_ANGLE_RAD = (surveillanceConfig.detection.angle * Math.PI) / 180;
  private readonly TRACKING_RATE = surveillanceConfig.trackingRate;
  private readonly PROJECTION_OFFSET = surveillanceConfig.detection.projectionOffset;
  private readonly PROJECTION_SCALE = surveillanceConfig.detection.projectionScale;
  private readonly RAYCAST_Y_OFFSET = surveillanceConfig.detection.raycastOrigingYOffset;
  private readonly LAMP_MUZZLE_OFFSET = surveillanceConfig.lamp.muzzleOffset;
  private readonly TILT = surveillanceConfig.lamp.tilt;

  private renderObserver: Observer<Scene> | null = null;
  private trackingElapsed = 0;

  private lamp: Mesh;
  private projection: Mesh;
  private orbitPivot: TransformNode;
  private surveyArea: Area;

  constructor(
    private scene: Scene,
    private barrel: Mesh,
    private rotationPivot: TransformNode,
    private stateMachine: CorridorSurveillanceStateMachine,
    private meshForPositionTrackName: string,
    private meshForRayCastDetectionName: string,
    private sweepDirection: 1 | -1 = 1,
    private barrelHeight: number = 3,
    surveyArea: Area
  ) {
    this.surveyArea = surveyArea;
    const { lamp, projection } = this.buildVisionEffect();
    this.lamp = lamp;
    this.projection = projection;
    // this.orbitPivot = orbitPivot;

    this.stateMachine.onStateChange((state) => this.updateVisionColor(state));
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

        // tracking con rate — pero apuntamos ANTES de chequear el rate
        // para que el cañón siempre esté orientado al jugador
        this.trackTarget();                    // ← movido fuera del rate limit

        this.trackingElapsed += dt;
        if (this.trackingElapsed >= this.TRACKING_RATE) {
          this.trackingElapsed = 0;
          // aquí podrían ir acciones con rate limit — sonidos, efectos, etc.
        }
      } else {
        this.trackingElapsed = 0;
        this.stateMachine.setState("searching");
      }
    });
  }

  stop(): void {
    if (this.renderObserver) {
      this.scene.onBeforeRenderObservable.remove(this.renderObserver);
      this.renderObserver = null;
    }
    if (this.stateMachine.isCollapsed()) {
      this.projection.dispose();
    }
  }


  // ─────────────────────────────────────────────
  //  DETECCIÓN — 
  // ─────────────────────────────────────────────

  private hasLineOfSight(): boolean {
    const target = this.scene.getMeshByName(this.meshForPositionTrackName);
    if (!target) return false;

    const pos = target.position;

    // 1 — Chequeo de bounds del área — fijo, sin rotación
    const inArea =
      pos.x >= this.surveyArea.minX &&
      pos.x <= this.surveyArea.maxX &&
      pos.z >= this.surveyArea.minZ &&
      pos.z <= this.surveyArea.maxZ;

    if (!inArea) return false;

    // 2 — Raycast desde el cañón hacia el jugador
    const origin = this.barrel.getAbsolutePosition().clone();
    origin.y += this.RAYCAST_Y_OFFSET;

    const dirToTarget = target.position.subtract(origin).normalize();
    const distance = Vector3.Distance(origin, target.position);

    const ray = new Ray(origin, dirToTarget, distance);
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
  //  EFECTOS VISUALES
  // ─────────────────────────────────────────────

  // ── buildVisionEffect — reemplazar completo ──
  private buildVisionEffect(): {
    lamp: Mesh;
    projection: Mesh;
  } {
    // ── Lámpara cónica en el cañón — sin cambios ──
    const lamp = MeshBuilder.CreateCylinder(
      `surveillance_lamp_${this.rotationPivot.name}`,
      {
        diameterTop: 0,
        diameterBottom: surveillanceConfig.lamp.diameterBottom,
        height: surveillanceConfig.lamp.height,
        tessellation: surveillanceConfig.lamp.tessellationLamp,
        cap: Mesh.NO_CAP,
      },
      this.scene
    );
    lamp.rotation.x = -(Math.PI / 2) + this.TILT;
    lamp.position = new Vector3(0, 0, this.LAMP_MUZZLE_OFFSET);
    lamp.parent = this.rotationPivot;
    lamp.isPickable = false;

    const lampMat = new StandardMaterial(
      `surveillance_lamp_mat_${this.rotationPivot.name}`, this.scene
    );
    lampMat.emissiveColor = new Color3(
      surveillanceConfig.colors.searching.lamp.r,
      surveillanceConfig.colors.searching.lamp.g,
      surveillanceConfig.colors.searching.lamp.b,
    );
    lampMat.disableLighting = true;
    lamp.material = lampMat;

    // ── Proyección — plano fijo sobre el área de detección ──
    const { emissive } = superVisionConfig.projection;
    const Y = surveillanceConfig.lamp.groundOffset;

    const points: Vector3[] = [
      new Vector3(this.surveyArea.minX, Y, this.surveyArea.minZ),
      new Vector3(this.surveyArea.maxX, Y, this.surveyArea.minZ),
      new Vector3(this.surveyArea.maxX, Y, this.surveyArea.maxZ),
      new Vector3(this.surveyArea.minX, Y, this.surveyArea.maxZ),
      new Vector3(this.surveyArea.minX, Y, this.surveyArea.minZ), // cerrar
    ];

    const projection = MeshBuilder.CreateLines(
      `surveillance_projection_${this.rotationPivot.name}`,
  { points },
  this.scene
);
    projection.color = new Color3(emissive.r, emissive.g, emissive.b);
    projection.isPickable = false;
    projection.setEnabled(false);

    const projMat = new StandardMaterial(
      `surveillance_proj_mat_${this.rotationPivot.name}`, this.scene
    );
    projMat.diffuseColor = new Color3(
      surveillanceConfig.colors.searching.projDiffuse.r,
      surveillanceConfig.colors.searching.projDiffuse.g,
      surveillanceConfig.colors.searching.projDiffuse.b,
    );
    projMat.emissiveColor = new Color3(
      surveillanceConfig.colors.searching.projEmissive.r,
      surveillanceConfig.colors.searching.projEmissive.g,
      surveillanceConfig.colors.searching.projEmissive.b,
    );
    projMat.alpha = surveillanceConfig.colors.searching.projAlpha;
    projMat.backFaceCulling = false;
    projMat.disableLighting = true;
    projMat.wireframe = true;   // ← solo contorno
    projection.material = projMat;
    projection.setEnabled(false);     // ← oculto por defecto

    return { lamp, projection };
  }

  dispose(): void {
    this.stop();
    this.lamp.dispose();
    this.projection.dispose();
  }

  private updateVisionColor(state: CorridorSurveillanceState): void {
    const lampMat = this.lamp.material as StandardMaterial;
    // const projMat = this.projection.material as StandardMaterial;
    const colors = surveillanceConfig.colors;

    switch (state) {
      case "searching":
        if (lampMat) lampMat.emissiveColor = new Color3(colors.searching.lamp.r, colors.searching.lamp.g, colors.searching.lamp.b);
        // if (projMat) {
        //   projMat.diffuseColor = new Color3(colors.searching.projDiffuse.r, colors.searching.projDiffuse.g, colors.searching.projDiffuse.b);
        //   projMat.emissiveColor = new Color3(colors.searching.projEmissive.r, colors.searching.projEmissive.g, colors.searching.projEmissive.b);
        //   projMat.alpha = colors.searching.projAlpha;
        // }
        break;

      case "alert":
        if (lampMat) lampMat.emissiveColor = new Color3(colors.alert.lamp.r, colors.alert.lamp.g, colors.alert.lamp.b);
        // if (projMat) {
        //   projMat.diffuseColor = new Color3(colors.alert.projDiffuse.r, colors.alert.projDiffuse.g, colors.alert.projDiffuse.b);
        //   projMat.emissiveColor = new Color3(colors.alert.projEmissive.r, colors.alert.projEmissive.g, colors.alert.projEmissive.b);
        //   projMat.alpha = colors.alert.projAlpha;
        // }
        break;

      case "collapsed":
        this.lamp.setEnabled(false);
        this.projection.setEnabled(false);
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