import {
  type Scene,
  Mesh,
  TransformNode,
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
  private readonly DETECTION_ANGLE_RAD = (surveillanceConfig.detection.angle * Math.PI) / 180;
  private readonly TRACKING_RATE = surveillanceConfig.trackingRate;
  private readonly PROJECTION_OFFSET = surveillanceConfig.detection.projectionOffset;
  private readonly PROJECTION_SCALE = surveillanceConfig.detection.projectionScale;
  private readonly RAYCAST_Y_OFFSET = surveillanceConfig.detection.raycastYOffset;
  private readonly LAMP_MUZZLE_OFFSET = surveillanceConfig.lamp.muzzleOffset;
  private readonly TILT = surveillanceConfig.lamp.tilt;

  private renderObserver: Observer<Scene> | null = null;
  private trackingElapsed = 0;

  private lamp: Mesh;
  private projection: Mesh;
  private orbitPivot: TransformNode;

  constructor(
    private scene: Scene,
    private barrel: Mesh,
    private rotationPivot: TransformNode,
    private stateMachine: SurveillanceStateMachine,
    private meshForPositionTrackName: string,
    private meshForRayCastDetectionName: string,
    private sweepDirection: 1 | -1 = 1,
    private barrelHeight: number = 3,
  ) {
    const { lamp, projection, orbitPivot } = this.buildVisionEffect(barrelHeight);
    this.lamp = lamp;
    this.projection = projection;
    this.orbitPivot = orbitPivot;

    this.stateMachine.onStateChange((state) => this.updateVisionColor(state));
  }

  // ─────────────────────────────────────────────
  //  CICLO DE VIDA
  // ─────────────────────────────────────────────
  start(): void {
    this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
      if (this.stateMachine.isCollapsed()) return;

      // Sincronizar rotación del orbitPivot con el rotationPivot
      this.orbitPivot.rotation.y = this.rotationPivot.rotation.y;

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
    this.lamp.dispose();
    this.projection.dispose();
    this.orbitPivot.dispose();
  }

  // ─────────────────────────────────────────────
  //  DETECCIÓN — elipse en el suelo
  // ─────────────────────────────────────────────
  private hasLineOfSight(): boolean {
    const target = this.scene.getMeshByName(this.meshForPositionTrackName);
    if (!target) return false;

    const barrelPos = this.barrel.getAbsolutePosition();
    const distToGround = this.barrelHeight / Math.tan(this.TILT);
    const forward = this.rotationPivot.forward.normalize();

    const centerX = barrelPos.x + forward.x * distToGround * this.PROJECTION_OFFSET;
    const centerZ = barrelPos.z + forward.z * distToGround * this.PROJECTION_OFFSET;

    const projRadius = this.PROJECTION_SCALE;

    const dx = target.position.x - centerX;
    const dz = target.position.z - centerZ;
    const angle = this.orbitPivot.rotation.y;

    const localX = dx * Math.cos(-angle) + dz * Math.sin(-angle);
    const localZ = -dx * Math.sin(-angle) + dz * Math.cos(-angle);

    const inCircle = (localX ** 2 + localZ ** 2) <= projRadius ** 2;
    if (!inCircle) return false;

    const origin = barrelPos.clone();
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
  private buildVisionEffect(barrelHeight: number): {
    lamp: Mesh; projection: Mesh; orbitPivot: TransformNode;
  } {
    const distToGround = barrelHeight / Math.tan(this.TILT);

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

    const lampMat = new StandardMaterial(`surveillance_lamp_mat_${this.rotationPivot.name}`, this.scene);
    lampMat.emissiveColor = new Color3(
      surveillanceConfig.colors.searching.lamp.r,
      surveillanceConfig.colors.searching.lamp.g,
      surveillanceConfig.colors.searching.lamp.b,
    );
    lampMat.disableLighting = true;
    lamp.material = lampMat;

    const barrelWorldPos = this.barrel.getAbsolutePosition();
    const orbitPivot = new TransformNode(
      `surveillance_orbit_pivot_${this.rotationPivot.name}`,
      this.scene
    );
    orbitPivot.position.x = barrelWorldPos.x;
    orbitPivot.position.y = 0;
    orbitPivot.position.z = barrelWorldPos.z;

    const projection = MeshBuilder.CreateDisc(
      `surveillance_projection_${this.rotationPivot.name}`,
      { radius: 1, tessellation: surveillanceConfig.lamp.tessellationDisc, sideOrientation: Mesh.DOUBLESIDE },
      this.scene
    );
    projection.rotation.x = Math.PI / 2;
    projection.scaling.x = this.PROJECTION_SCALE;
    projection.scaling.y = this.PROJECTION_SCALE;
    projection.scaling.z = 1;
    projection.position = new Vector3(0, surveillanceConfig.lamp.groundOffset, distToGround * this.PROJECTION_OFFSET);
    projection.parent = orbitPivot;
    projection.isPickable = false;

    const projMat = new StandardMaterial(`surveillance_proj_mat_${this.rotationPivot.name}`, this.scene);
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
    projection.material = projMat;

    return { lamp, projection, orbitPivot };
}

  private updateVisionColor(state: SurveillanceState): void {
    const lampMat = this.lamp.material as StandardMaterial;
    const projMat = this.projection.material as StandardMaterial;
    const colors = surveillanceConfig.colors;

    switch (state) {
      case "searching":
        if (lampMat) lampMat.emissiveColor = new Color3(colors.searching.lamp.r, colors.searching.lamp.g, colors.searching.lamp.b);
        if (projMat) {
          projMat.diffuseColor = new Color3(colors.searching.projDiffuse.r, colors.searching.projDiffuse.g, colors.searching.projDiffuse.b);
          projMat.emissiveColor = new Color3(colors.searching.projEmissive.r, colors.searching.projEmissive.g, colors.searching.projEmissive.b);
          projMat.alpha = colors.searching.projAlpha;
        }
        break;

      case "alert":
        if (lampMat) lampMat.emissiveColor = new Color3(colors.alert.lamp.r, colors.alert.lamp.g, colors.alert.lamp.b);
        if (projMat) {
          projMat.diffuseColor = new Color3(colors.alert.projDiffuse.r, colors.alert.projDiffuse.g, colors.alert.projDiffuse.b);
          projMat.emissiveColor = new Color3(colors.alert.projEmissive.r, colors.alert.projEmissive.g, colors.alert.projEmissive.b);
          projMat.alpha = colors.alert.projAlpha;
        }
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