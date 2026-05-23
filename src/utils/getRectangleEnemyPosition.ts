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
    const randomSide = Math.random() < 0.5 ? 0 : 1;

    const groundHalfW = groundConfig.width / 2;   // 50
    const groundHalfH = groundConfig.height / 2;   // 50

    let x: number;
    let z: number;
    let forwardX: number;
    let forwardZ: number;
    let extendedArea: Area = { ...area };

    if (width < depth) {
        const midX = (area.minX + area.maxX) / 2;
        const offset = width * offsetPercentage;

        if (randomSide === 0) {
            z = area.minZ + offset;
            forwardZ = 1;
            extendedArea = {
                ...area,
                maxZ: groundHalfH,
                depth: groundHalfH - area.minZ,
                surface: width * (groundHalfH - area.minZ),
            };
        } else {
            z = area.maxZ - offset;
            forwardZ = -1;
            extendedArea = {
                ...area,
                minZ: -groundHalfH,
                depth: area.maxZ + groundHalfH,
                surface: width * (area.maxZ + groundHalfH),
            };
        }
        x = midX;
        forwardX = 0;

    } else {
        const midZ = (area.minZ + area.maxZ) / 2;
        const offset = depth * offsetPercentage;

        if (randomSide === 0) {
            x = area.minX + offset;
            forwardX = 1;
            extendedArea = {
                ...area,
                maxX: groundHalfW,
                width: groundHalfW - area.minX,
                surface: depth * (groundHalfW - area.minX),
            };
        } else {
            x = area.maxX - offset;
            forwardX = -1;
            extendedArea = {
                ...area,
                minX: -groundHalfW,
                width: area.maxX + groundHalfW,
                surface: depth * (area.maxX + groundHalfW),
            };
        }
        z = midZ;
        forwardZ = 0;
    }

    return {
        position: new Vector3(x, 0, z),
        forward: new Vector3(forwardX, 0, forwardZ),
        area: extendedArea,
    };
}
