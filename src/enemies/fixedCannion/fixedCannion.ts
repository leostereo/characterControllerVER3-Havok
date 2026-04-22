import type { Scene, StandardMaterial, Vector3 } from "@babylonjs/core";


export type EnemyStatus = 'ready' | 'alert' | 'idle' | 'destroyed';

export class FixedCannion {

    PROJECTILE_SHOOTING_RATE = 1500;
    PROJECTILE_SHOOTING_SPEED = 50;
    position: Vector3;
    meshToShootName: string;
    status: EnemyStatus;
    scene: Scene;
    projectileMaterial: StandardMaterial;
    //enemyData: EnemyData;
    //projectileManager: ProjectileManagerClass;

    constructor(
        position: Vector3,
        meshNameToFollow: string,
        scene: Scene,
        status?: EnemyStatus
        
    ){
        console.warn(position,meshNameToFollow,scene,status);

    }
}