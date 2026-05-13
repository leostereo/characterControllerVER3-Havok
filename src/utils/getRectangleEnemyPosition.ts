import { enemyPlacementConfig } from "@/config/GameConfig";
import { type Area } from "@/playground/builders/BuildMap";
import { Vector3 } from "@babylonjs/core";

export interface EnemyPositionData {
    position: Vector3;
    forward: Vector3;
}

export function getRectangleEnemyPosition(area: Area): EnemyPositionData {
    // Calcular dimensiones del área
    const width = area.maxX - area.minX;
    const depth = area.maxZ - area.minZ;

    // Offset del 5% hacia el centro
    const offsetPercentage = enemyPlacementConfig.offsetPercentage;

    // Seleccionar aleatoriamente entre los lados más cortos
    const randomSide = Math.random() < 0.5 ? 0 : 1;

    let x: number;
    let z: number;
    let forwardX: number;
    let forwardZ: number;

    if (width < depth) {
        // Los lados más cortos son frontal/trasero
        const midX = (area.minX + area.maxX) / 2;
        const offset = width * offsetPercentage;

        if (randomSide === 0) {
            // Lado frontal
            z = area.minZ + offset;
            forwardZ = 1; // Apunta hacia maxZ
        } else {
            // Lado trasero
            z = area.maxZ - offset;
            forwardZ = -1; // Apunta hacia minZ
        }
        x = midX;
        forwardX = 0;
    } else {
        // Los lados más cortos son izquierdo/derecho
        const midZ = (area.minZ + area.maxZ) / 2;
        const offset = depth * offsetPercentage;

        if (randomSide === 0) {
            // Lado izquierdo
            x = area.minX + offset;
            forwardX = 1; // Apunta hacia maxX
        } else {
            // Lado derecho
            x = area.maxX - offset;
            forwardX = -1; // Apunta hacia minX
        }
        z = midZ;
        forwardZ = 0;
    }

    return {
        position: new Vector3(x, 0, z),
        forward: new Vector3(forwardX, 0, forwardZ),
    };
}
