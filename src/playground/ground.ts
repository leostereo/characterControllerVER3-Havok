import type { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/";
import { Color3, Vector3 } from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import { FixedCanionEnemy } from "@/enemies/fixedCannion/fixedCanion";
import { BasicCoverWall } from "./coverWall/basicCoverWall";
import { GameConfig } from "@/config/GameConfig";

export class Ground {
  constructor(private scene: Scene) {
    this.scene = scene;
    this._createGround();
    this._createSphere();
    this._createRamp();
    this._createPlatform();
    this._createFixedCanion();
    this._createBasicCoverWall();
  }

  _createGround(): void {
    const mesh = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, this.scene);
    // Grid material
    const gridMat = new GridMaterial("gridMat", this.scene);
    gridMat.majorUnitFrequency = 5;   // línea gruesa cada 5 unidades
    gridMat.minorUnitVisibility = 0.5; // opacidad de líneas finas
    gridMat.gridRatio = 1;             // 1 celda = 1 unidad de mundo
    gridMat.backFaceCulling = false;
    gridMat.mainColor = new Color3(1, 1, 1);
    gridMat.lineColor = new Color3(0.5, 0.5, 0.5);
    gridMat.opacity = 0.98;
    mesh.material = gridMat;
    new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
  }

  _createSphere(): void {
    const mesh = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, this.scene);
    mesh.position.y = 4;
    mesh.position.x = 4;

    new PhysicsAggregate(mesh, PhysicsShapeType.SPHERE, { mass: 1, restitution: 0.75 }, this.scene);
  }

  _createRamp(): void {

    const ramp = MeshBuilder.CreateBox("Platform", { width: 4, height: 0.2, depth: 40 }, this.scene);
    ramp.position = new Vector3(0, 10, -40);
    ramp.rotation = new Vector3(145, 0, 0);
    new PhysicsAggregate(ramp, PhysicsShapeType.BOX, { mass: 0 });

  }

  _createPlatform(): void {

    const platform = MeshBuilder.CreateBox("Platform", { width: 4, height: 0.2, depth: 4 }, this.scene);
    platform.position.set(-4, 1, -12);
    // platform.material = this.scene.getMeshByName("Cube").material;
    const platformAggregate = new PhysicsAggregate(platform, PhysicsShapeType.BOX, { mass: 0.1 });
    platformAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
    platformAggregate.body.disablePreStep = false;
    let platformTime = 0;
    this.scene.onBeforeRenderObservable.add(() => {
      platform.rotate(new Vector3(0, 1, 0), 0.005);
      platform.position.y = Math.sin(platformTime) * 20 + 10.2;
      if (this.scene.deltaTime) {
        platformTime += this.scene.deltaTime * 0.001;
      }
    });
  }

  _createFixedCanion(): void {
    const playerMeshName = GameConfig.player.player1.meshName;
    new FixedCanionEnemy(this.scene, new Vector3(10, 0, 10), playerMeshName);
  }

  _createBasicCoverWall(): void {
    new BasicCoverWall(
      this.scene,
      new Vector3(0, 0,20),   // posición en el mapa
      { width: 10.0, height: 2.4 },
      Math.PI / 2             // rotación hacia el cañón
    );
  }
}
