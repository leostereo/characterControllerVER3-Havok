// src/enemies/cyborgV1/CyborgFactory.ts
// import "@babylonjs/loaders/glTF";

import {
  type Scene,
  Color3,
  PBRMaterial,
  LoadAssetContainerAsync,
  type Vector3
} from "@babylonjs/core";
import { CyborgMain } from "./CyborgMain";
import { playerConfig } from "@/config/GameConfig";

export class CyborgFactory {

  // ─────────────────────────────────────────────
  //  FACTORY METHOD
  // ─────────────────────────────────────────────
  static async create(
    scene: Scene,
    position: Vector3,
  ): Promise<CyborgMain> {
    const uniqueId = `cyborg_${Math.random().toString(36).slice(2, 7)}`;

    const result = await LoadAssetContainerAsync("./model/cyborg.glb", scene, {
      pluginOptions: { gltf: { animationStartMode: 0 } },
    });

    result.addAllToScene();

    const pbr = new PBRMaterial("pbr", scene);
    pbr.albedoColor = Color3.Gray()
    pbr.metallic = 0.0;  // Hazlo metálico para reflejos intensos
    pbr.roughness = 0.0; // Hazlo extremadamente liso y brillante

    // renombrar meshes con uniqueId
    result.meshes.forEach(m => {
      m.name = `${m.name}_${uniqueId}`;
      m.material = pbr
    });

    // renombrar animation groups con uniqueId
    result.animationGroups.forEach(ag => {
      ag.name = `${ag.name}_${uniqueId}`;
    });

    const rootMesh = result.meshes.find(m => m.name === `__root___${uniqueId}`);
    if (!rootMesh) {
      throw new Error('no hay mesh para model');
    }
    return new CyborgMain(
      scene,
      uniqueId,
      rootMesh,
      result.animationGroups,
      position,
      playerConfig.player1.positionTrackeableMeshName,
      playerConfig.player1.player1RaycastDetectableName,
    );
  }

}