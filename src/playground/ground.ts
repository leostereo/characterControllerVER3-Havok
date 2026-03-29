import type { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/";
import { Vector3 } from "@babylonjs/core";

export class Ground {
  constructor(private scene: Scene) {
    this.scene = scene;
    this._createGround();
    this._createSphere();
    this._createPlatform();
  }

  _createGround(): void {
    const mesh = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, this.scene);
    const pa = new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
    //pa.body.startAsleep = true;
    console.warn(pa);
  }

  _createSphere(): void {
    const mesh = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, this.scene);
    mesh.position.y = 4;
    mesh.position.x = 4;

    new PhysicsAggregate(mesh, PhysicsShapeType.SPHERE, { mass: 1, restitution: 0.75 }, this.scene);
  }

  _createPlatform(): void {

    const platform = MeshBuilder.CreateBox("Platform", { width: 4, height: 0.2, depth: 4 }, this.scene);
    platform.position.set(-4, 1, -12);
    // platform.material = this.scene.getMeshByName("Cube").material;
    var platformAggregate = new PhysicsAggregate(platform, PhysicsShapeType.BOX, { mass: 0.1 });
    platformAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
    platformAggregate.body.disablePreStep = false;
    var platformTime = 0;
    this.scene.onBeforeRenderObservable.add(() => {
      platform.rotate(new Vector3(0, 1, 0), 0.005);
      platform.position.y = Math.sin(platformTime) * 2. + 1.2;
      if (this.scene.deltaTime) {
        platformTime += this.scene.deltaTime * 0.001;
      }
    });
  }

}
