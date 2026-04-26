// src/config/GameConfig.ts

// ─────────────────────────────────────────────
//  PLAYER
// ─────────────────────────────────────────────
export const playerConfig = {
    height: 1.8,
    capsuleRadius: 0.4,
    speedOnGround: 10.0,
    speedInAir: 8.0,
    jumpHeight: 3.5,
    rotateSpeed: 2.0,
    runMultiplier: 1.8,
    backwardsMultiplier: 0.3,
    player1: {
        meshName: 'player1',
        name: 'player1',
        player1Raycast: "player1_Alpha_Joints",
        player1Collision: "player1_colision"
    }
} as const;

// ─────────────────────────────────────────────
//  GROUND
// ─────────────────────────────────────────────
export const groundConfig = {
    width: 100,
    height: 100
} as const;

// ─────────────────────────────────────────────
//  FÍSICA
// ─────────────────────────────────────────────
export const physicsConfig = {
    gravity: -18,
    knockbackForce: 8.0,
} as const;

// ─────────────────────────────────────────────
//  ENEMIGOS
// ─────────────────────────────────────────────
export const enemiesConfig = {
    canion: {
        shootingRate: 2000,
        turretHeightMult: 1.2,
        aimHeightMult: 0.6,
        searchRotateSpeed: 0.8,  // ← agregado

    },
} as const;

// ─────────────────────────────────────────────
//  PROYECTILES
// ─────────────────────────────────────────────
export const projectilesConfig = {
    canion: {
        speed: 1500,
        mass: 5,
        radius: 0.12,
        restitution: 0.0,
        friction: 0.0,
        maxLifetime: 4000,
    },
    frisbee: {
        mass: 10,
        impulse: 1000,
        restitution: 0.75,
        lifetime: 4000,
    },
} as const;

// ─────────────────────────────────────────────
//  COVER WALL
// ─────────────────────────────────────────────
export const coverWallConfig = {
    width: 3.0,
    height: 1.4,
    depth: 0.3,
    restitution: 0.6,
    friction: 0.4,
} as const;

// ─────────────────────────────────────────────
//  NOMBRES DE MESHES
// ─────────────────────────────────────────────
export const meshNames = {
    // player: "playerCapsule",
    // player1Raycast: "player1_Alpha_Joints",
    coverWall: "cover_wall",
    projectile: "projectile",
    canionRoot: "canio_root",
    canionBase: "canio_base",
    canionBody: "canio_body",
    canionPivot: "canio_barrel_pivot",
    canionBarrel: "canio_barrel",
    canionMuzzle: "canio_muzzle",
} as const;

// ─────────────────────────────────────────────
//  AUDIO  — completar
// ─────────────────────────────────────────────
export const audioConfig = {
    masterVolume: 1.0,
    sfxVolume: 1.0,
    musicVolume: 0.5,
} as const;

// ─────────────────────────────────────────────
//  CAMERA  — completar
// ─────────────────────────────────────────────
export const cameraConfig = {
    followCamera: {
        radius: 15,
        heightOffset: 10,
        rotationOffset: 180,
        cameraAcceleration: 0.05,
        maxCameraSpeed: 10
    }
} as const;

// ─────────────────────────────────────────────
//  UI  — completar
// ─────────────────────────────────────────────
export const uiConfig = {
    hudOpacity: 1.0,
} as const;

export const meshMetadata = {
    types: {
        enemy: "enemy",
        player: "player",
        terrain: "terrain",
        cover: "cover",
    },
    enemyClasses: {
        canion: "canion",
    },
} as const;


// ─────────────────────────────────────────────
//  TIPOS DERIVADOS
// ─────────────────────────────────────────────
export type PlayerConfig = typeof playerConfig;
export type PhysicsConfig = typeof physicsConfig;
export type EnemiesConfig = typeof enemiesConfig;
export type ProjectilesConfig = typeof projectilesConfig;
export type CoverWallConfig = typeof coverWallConfig;
export type MeshNames = typeof meshNames;
export type AudioConfig = typeof audioConfig;
export type UiConfig = typeof uiConfig;
export type MeshMetadata = {
    type: typeof meshMetadata.types[keyof typeof meshMetadata.types];
    enemyClass?: typeof meshMetadata.enemyClasses[keyof typeof meshMetadata.enemyClasses];
};