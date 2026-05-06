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
    aimHeightMultiplier: 0.5,
    player1: {
        positionTrackeableMeshName: 'player1_trackeable',
        name: 'player1',
        player1RaycastDetectableName: "player1_rayCast_detectable",
        player1CollisionDetectableName: "player1_colision_detectable"
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
        speed: 300,
        mass: 5,
        radius: 0.2,
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
    height: 2,
    depth: 0.3,
    restitution: 0.6,
    friction: 0.4,
} as const;

// ─────────────────────────────────────────────
//  NOMBRES DE MESHES
// ─────────────────────────────────────────────
export const meshNames = {
    coverWall: "cover_wall",
    projectile: "projectile",
    canionRoot: "canio_root",
    canionBase: "canio_base",
    canionBody: "canio_body",
    canionPivot: "canio_barrel_pivot",
    canionBarrel: "canio_barrel",
    canionMuzzle: "canio_muzzle",
    ground: "playground_ground",

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
        heightOffset: 8,
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
        surveillance: "surveillance",
    },
} as const;

export const playgroundConfig = {
    groundSize: 60,
    wallCount: 50,
    enemyCount: 6,
    spawnSafeRadius: 8,
    playerSpawn: { x: 0, z: 0 },
} as const;

export const surveillanceConfig = {
  heights: {
    low:     1.0,
    middle:  1.4,
    highest: 2.0,
  },
  shootingRate:      2500,
  searchRotateSpeed: 0.6,
  trackingRate:      500,
  detection: {
    range:            15,
    angle:            35,
    projectionOffset: 3.5,
    projectionScale:  10,
    raycastYOffset:   0.8,   // ← nuevo
  },
  lamp: {
    muzzleOffset:     1.15,
    diameterBottom:   0.3,
    height:           0.4,
    tessellationLamp: 8,
    tessellationDisc: 64,
    groundOffset:     0.02,
    tilt:             Math.PI / 4,
  },
  colors: {
    searching: {
      lamp:          { r: 1.0, g: 0.9, b: 0.0 },
      projDiffuse:   { r: 1.0, g: 0.9, b: 0.0 },
      projEmissive:  { r: 0.3, g: 0.25, b: 0.0 },
      projAlpha:     0.15,
    },
    alert: {
      lamp:          { r: 1.0, g: 0.1, b: 0.0 },
      projDiffuse:   { r: 1.0, g: 0.1, b: 0.0 },
      projEmissive:  { r: 0.4, g: 0.0, b: 0.0 },
      projAlpha:     0.25,
    },
  },
} as const;

// ─────────────────────────────────────────────
//  TIPOS DERIVADOS
// ─────────────────────────────────────────────
export type SurveillanceHeight = keyof typeof surveillanceConfig.heights;
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
    canionId?: string;
    stationId?: string;
};