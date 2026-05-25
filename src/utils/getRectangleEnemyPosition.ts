import { enemyPlacementConfig, groundConfig } from "@/config/GameConfig";
import { type Area } from "@/playground/builders/BuildMap";
import { Vector3 } from "@babylonjs/core";

export interface EnemyPositionData {
    position: Vector3;
    forward: Vector3;
    area: Area;    // ← nuevo
}

export function getRectangleEnemyPosition(area: Area): EnemyPositionData {
  const width = area.maxX - area.minX;
  const depth = area.maxZ - area.minZ;

  const offsetPercentage = enemyPlacementConfig.offsetPercentage;
  const widthExpand      = enemyPlacementConfig.corridorWidthExpand;
  const randomSide       = Math.random() < 0.5 ? 0 : 1;

  const groundHalfW = groundConfig.width  / 2;
  const groundHalfH = groundConfig.height / 2;

  let x: number;
  let z: number;
  let forwardX: number;
  let forwardZ: number;
  let extendedArea: Area = { ...area };

  if (width < depth) {
    const midX    = (area.minX + area.maxX) / 2;
    const offset  = width * offsetPercentage;
    const expandX = width * widthExpand / 2;

    if (randomSide === 0) {
      z        = area.minZ + offset;
      forwardZ = 1;
      extendedArea = {
        ...area,
        minX:    area.minX - expandX,
        maxX:    area.maxX + expandX,
        width:   width + expandX * 2,
        maxZ:    groundHalfH,
        depth:   groundHalfH - area.minZ,
        surface: (width + expandX * 2) * (groundHalfH - area.minZ),
        center:  new Vector3(midX, 0, (area.minZ + groundHalfH) / 2),
      };
    } else {
      z        = area.maxZ - offset;
      forwardZ = -1;
      extendedArea = {
        ...area,
        minX:    area.minX - expandX,
        maxX:    area.maxX + expandX,
        width:   width + expandX * 2,
        minZ:    -groundHalfH,
        depth:   area.maxZ + groundHalfH,
        surface: (width + expandX * 2) * (area.maxZ + groundHalfH),
        center:  new Vector3(midX, 0, (area.maxZ - groundHalfH) / 2),
      };
    }
    x        = midX;
    forwardX = 0;

  } else {
    const midZ    = (area.minZ + area.maxZ) / 2;
    const offset  = depth * offsetPercentage;
    const expandZ = depth * widthExpand / 2;

    if (randomSide === 0) {
      x        = area.minX + offset;
      forwardX = 1;
      extendedArea = {
        ...area,
        minZ:    area.minZ - expandZ,
        maxZ:    area.maxZ + expandZ,
        depth:   depth + expandZ * 2,
        maxX:    groundHalfW,
        width:   groundHalfW - area.minX,
        surface: (depth + expandZ * 2) * (groundHalfW - area.minX),
        center:  new Vector3((area.minX + groundHalfW) / 2, 0, midZ),
      };
    } else {
      x        = area.maxX - offset;
      forwardX = -1;
      extendedArea = {
        ...area,
        minZ:    area.minZ - expandZ,
        maxZ:    area.maxZ + expandZ,
        depth:   depth + expandZ * 2,
        minX:    -groundHalfW,
        width:   area.maxX + groundHalfW,
        surface: (depth + expandZ * 2) * (area.maxX + groundHalfW),
        center:  new Vector3((area.maxX - groundHalfW) / 2, 0, midZ),
      };
    }
    z        = midZ;
    forwardZ = 0;
  }

  return {
    position: new Vector3(x, 0, z),
    forward:  new Vector3(forwardX, 0, forwardZ),
    area:     extendedArea,
  };
}