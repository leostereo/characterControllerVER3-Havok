// src/config/GameConfig.ts

// ─────────────────────────────────────────────
//  PLAYER
// ─────────────────────────────────────────────
export const playerConfig = {
    initialLives: 5,
    height: 1.8,
    capsuleRadius: 0.4,
    aimHeightMultiplier: 0.5,
    capsuleBottomPoint: -0.5,
    capsuleCrouchTopPoint: 0.1,
    capsuleStandingTopPoint: 0.5,
    speedOnGround: 6.0,
    speedInAir: 8.0,
    jumpHeight: 3.5,
    gravity: -18,
    rotateSpeed: 2.0,
    rotateStepDeg: 1.0,
    rotateAccumulatorMaxSteps: 10,
    runMultiplier: 1.8,
    knockbackForce: 5.0,
    backwardsMultiplier: 0.3,
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
    hitCooldownMs: 2000,  // ← 3 segundos de cooldown
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
        speed_2: 500,
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
        wall: "wall"
    },
    enemyClasses: {
        canion: "canion",
        surveillance: "surveillance",
        sentinel: "sentinel",
        cyborg: "cyborg"
    },
    wallClasses: {
        basic: "basic",
        heavy: "heavy",
    },
} as const;

export const playgroundConfig = {
    groundSize: 60,
    enemyCount: 0,
    spawnSafeRadius: 8,
    playerSpawn: { x: 0, z: 0 },
} as const;

export const surveillanceConfig = {
    heights: {
        low: 1.0,
        middle: 1.4,
        highest: 2.0,
    },
    shootingRate: 1000,
    searchRotateSpeed: 0.6,
    trackingRate: 200,
    detection: {
        range: 15,
        angle: 35,
        projectionOffset: 3.5,
        projectionScale: 10,
        raycastOrigingYOffset: 0.8,
        raycastEndingYOffsetMultiplier: 0.85,
    },
    lamp: {
        muzzleOffset: 1.15,
        diameterBottom: 0.3,
        height: 0.4,
        tessellationLamp: 8,
        tessellationDisc: 64,
        groundOffset: 0.02,
        tilt: Math.PI / 4,
    },
    colors: {
        searching: {
            lamp: { r: 1.0, g: 0.9, b: 0.0 },
            projDiffuse: { r: 1.0, g: 0.9, b: 0.0 },
            projEmissive: { r: 0.3, g: 0.25, b: 0.0 },
            projAlpha: 0.15,
        },
        alert: {
            lamp: { r: 1.0, g: 0.1, b: 0.0 },
            projDiffuse: { r: 1.0, g: 0.1, b: 0.0 },
            projEmissive: { r: 0.4, g: 0.0, b: 0.0 },
            projAlpha: 0.25,
        },
    },
} as const;


export const unitBlockConfig = {
    size: 1.0,
    physics: {
        normal: { mass: 0, restitution: 0.6, friction: 0.4 },
        destructible: { mass: 0, restitution: 0.4, friction: 0.5 },
        heavy: { mass: 0, restitution: 0.2, friction: 0.9 },
    },
    material: {
        normal: { diffuse: { r: 0.07, g: 0.09, b: 0.13 }, emissive: { r: 0.00, g: 0.15, b: 0.35 }, specular: { r: 0.80, g: 0.80, b: 0.80 }, alpha: 1.00 },
        destructible: { diffuse: { r: 0.07, g: 0.09, b: 0.13 }, emissive: { r: 0.00, g: 0.15, b: 0.35 }, specular: { r: 0.80, g: 0.80, b: 0.80 }, alpha: 0.55 },
        heavy: { diffuse: { r: 0.07, g: 0.09, b: 0.13 }, emissive: { r: 0.00, g: 0.15, b: 0.35 }, specular: { r: 0.80, g: 0.80, b: 0.80 }, alpha: 1.00 },
    },
    pipe: {
        diameter: 0.06,
        tessellation: 8,
        color: { r: 0.00, g: 0.40, b: 1.00 },
    },
} as const;

export const wallShapes = {
    I: [[1], [1], [1]],
    L: [[1, 0], [1, 0], [1, 1]],
    T: [[1, 1, 1], [0, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    elbow: [[1, 0], [1, 1]],
    square: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
    cross: [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
    n: [[1, 1, 1], [1, 0, 1], [1, 0, 1]],
} as const;

export type ShapeName = keyof typeof wallShapes;

export const wallsBuilderConfig = {

    wallGroupCount: 40,     // grupos a generar
    maxTramLength: 16,     // largo máximo del tramo I en bloques
    minTramLength: 2,     // largo mínimo antes de descartar el grupo
    wallHeights: [1, 2, 3, 4],   // ← reemplaza wallHeight
    spawnSafeRadius: 8,
    minGroupSpacing: 5,
    groundMargin: 2,
    safetyPlace: {
        heightMultiplier: 2,
        material: {
            diffuse: { r: 0.02, g: 0.25, b: 0.05 },
            emissive: { r: 0.0, g: 0.35, b: 0.08 },  // ← era 0.8, mucho más suave
            specular: { r: 0.5, g: 1.0, b: 0.5 },
            alpha: 1.0,
        },
    },

} as const;

export const playGroundStateConfig = {
    maxAreas: 16,
    minAreaSide: 3,
    squareMaxRatio: 1.5,
    corridorMinRatio: 3.5,
} as const;

export const enemyPlacementConfig = {
    offsetPercentage: 0.1,
    corridorWidthExpand: 0.3,   // ← nuevo — 30% más ancho
} as const;

export const corridorSurveillanceConfig = {
    burstCount: 3,      // proyectiles por ráfaga
    burstDelay: 120,    // ms entre proyectiles de la misma ráfaga
} as const;


// src/config/GameConfig.ts — agregar junto a surveillanceConfig

export const sentinelConfig = {
    shootingRate: 800,

    fsm: {
        intensiveSearchTimeout: 5000,
    },

    detection: {
        tilt: 0.4,
        projectionScale: 3,
        projectionOffset: 1,
        raycastYOffset: 0.5,
        aimHeightMult: 0.8,
        lampMuzzleOffset: 0.5,
        raycastEndingYOffsetMultiplier: 0.85,
    },

    sweep: {
        angle: Math.PI / 6,
        speed: 1.2,
    },

    tracking: {
        rate: 100,
    },

    agent: {
        speedPatrol: 3.5,   // ← era 2.0
        speedSearch: 5.0,   // ← era 3.5
        radius: 0.3,
        height: 1.0,
        maxAcceleration: 4.0,
        collisionQueryRange: 0.5,
        separationWeight: 1.0,
    },

    // src/config/GameConfig.ts — sentinelConfig.colors

    colors: {
        main: {
            diffuse: { r: 0.10, g: 0.12, b: 0.20 },
            emissive: { r: 0.05, g: 0.10, b: 0.35 },
            specular: { r: 0.90, g: 0.90, b: 1.00 },
        },
        accent: {
            diffuse: { r: 0.0, g: 0.55, b: 0.70 },
            emissive: { r: 0.0, g: 0.70, b: 0.90 },
        },
        cone: {
            patrolling: {
                lamp: { r: 1.0, g: 0.9, b: 0.0 },
                projDiffuse: { r: 1.0, g: 0.9, b: 0.0 },
                projEmissive: { r: 0.3, g: 0.25, b: 0.0 },
                projAlpha: 0.15,
            },
            shooting: {
                lamp: { r: 1.0, g: 0.1, b: 0.0 },
                projDiffuse: { r: 1.0, g: 0.1, b: 0.0 },
                projEmissive: { r: 0.4, g: 0.0, b: 0.0 },
                projAlpha: 0.25,
            },
            searching: {
                lamp: { r: 1.0, g: 0.5, b: 0.0 },
                projDiffuse: { r: 1.0, g: 0.5, b: 0.0 },
                projEmissive: { r: 0.3, g: 0.15, b: 0.0 },
                projAlpha: 0.20,
            },
            intensiveSearch: {
                lamp: { r: 1.0, g: 0.1, b: 0.0 },
                projDiffuse: { r: 1.0, g: 0.0, b: 0.0 },
                projEmissive: { r: 0.5, g: 0.0, b: 0.0 },
                projAlpha: 0.35,
            },
        },
    },
} as const;

export const superVisionConfig = {
    projection: {
        alpha: 0.5,                         // ← era 0.18, más visible
        emissive: { r: 0.0, g: 1.0, b: 0.92 }, // ← más intenso
        diffuse: { r: 0.0, g: 1.0, b: 0.92 },
    },
} as const;

export const soundConfig = {
    volumes: {
        player_impulse_to_jump: 0.5,
        player_recibe_damage: 0.6,
        player_going_death: 0.8,
        projectile_against_player: 0.5,
        projectile_against_playground: 0.4,
        freesbe_against_metal: 0.03,
        freesbe_woosh: 0.7,
        enemy_collapsed: 0.8,
    },
} as const;

export const controlsConfig = {
    keys: [
        { key: "W A S D", action: "Move / Moverse" },
        { key: "SPACE", action: "Jump / Saltar" },
        { key: "SPACE + J", action: "Air throw / Lanzamiento aéreo" },
        { key: "SHIFT", action: "Run / Correr" },
        { key: "SHIFT + J", action: "Power throw / Lanzamiento power" },
        { key: "WASD + SHIFT + K", action: "Roll" },
        { key: "J", action: "Freesbe throw / Lanzar freesbe" },
        { key: "K", action: "Crouch / Agacharse" },
        { key: "WASD + K", action: "Sneak / Camina agazapado" },
        { key: "1, 2", action: "Views / Vistas" },
        { key: "Q", action: "Super vision / Super visión" },
        { key: "H", action: "Controls config / Controles" },
    ],
} as const;

// en GameConfig — agregar config del cyborg projectile
export const cyborgConfig = {
  projectile: {
    speed:        15,
    radius:       0.05,
    height:       0.8,
    maxLifetime:  3000,
    shootingRate: 1000,
    color: {
      diffuse:  { r: 0.0, g: 0.8, b: 1.0 },
      emissive: { r: 0.0, g: 1.0, b: 1.0 },
    },
  },
  detection: {
    tilt:             0.4,
    projectionScale:  3,
    projectionOffset: 1,
    raycastYOffset:   1.2,    // ← más alto que sentinel, es humanoid
    aimHeightMult:    0.8,
    lampMuzzleOffset: 0.5,
    coneAngle:        Math.PI / 6,  // ← 30 grados
  },
  sweep: {
    angle: Math.PI / 6,
    speed: 1.2,
  },
  agent: {
    speedPatrol:          2.5,
    speedSearch:          4.0,
    stopDistance:         2.0,
    radius:               0.3,
    height:               1.8,
    maxAcceleration:      4.0,
    collisionQueryRange:  0.5,
    separationWeight:     1.0,
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
    wallClass?: typeof meshMetadata.wallClasses[keyof typeof meshMetadata.wallClasses];
    canionId?: string;
    stationId?: string;
};