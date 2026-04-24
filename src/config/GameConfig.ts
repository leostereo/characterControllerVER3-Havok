export const GameConfig = {

    // ─────────────────────────────────────────────
    //  PLAYER
    // ─────────────────────────────────────────────
    player: {
        height: 1.8,
        capsuleRadius: 0.4,
        speedOnGround: 10.0,
        speedInAir: 8.0,
        jumpHeight: 3.5,
        rotateSpeed: 2.0,
        runMultiplier: 1.8,
        backwardsMultiplier: 0.3,
        player1: {
            meshName: 'player1'
        }
    },

    // ─────────────────────────────────────────────
    //  FÍSICA
    // ─────────────────────────────────────────────
    physics: {
        gravity: -18,
        knockbackForce: 8.0,
        slowDownMultiplier: {
            zero:0,
            
            noChange:1
        }
    },

    // ─────────────────────────────────────────────
    //  ENEMIGOS
    // ─────────────────────────────────────────────
    enemies: {
        canion: {
            shootingRate: 2000,   // ms entre disparos
            turretHeightMult: 1.2,    // altura torreta = player.height × este valor
            aimHeightMult: 0.6,    // apunta al 60% de la altura del personaje
        },
    },

    // ─────────────────────────────────────────────
    //  PROYECTILES
    // ─────────────────────────────────────────────
    projectiles: {
        canion: {
            speed: 1500,
            mass: 5,
            radius: 0.12,
            restitution: 0.0,
            friction: 0.0,
            maxLifetime: 4000,   // ms antes de auto-destruirse
        },
        frisbee: {
            mass: 10,
            impulse: 1000,
            restitution: 0.75,
            lifetime: 4000,
        },
    },

    // ─────────────────────────────────────────────
    //  COVER WALL
    // ─────────────────────────────────────────────
    coverWall: {
        width: 3.0,
        height: 1.4,
        depth: 0.3,
        restitution: 0.6,
        friction: 0.4,
    },

    // ─────────────────────────────────────────────
    //  NOMBRES DE MESHES
    // ─────────────────────────────────────────────
    meshNames: {
        player: "playerCapsule",
        coverWall: "cover_wall",
        projectile: "projectile",
        canionRoot: "canio_root",
        canionBase: "canio_base",
        canionBody: "canio_body",
        canionPivot: "canio_barrel_pivot",
        canionBarrel: "canio_barrel",
        canionMuzzle: "canio_muzzle",
    },

    // ─────────────────────────────────────────────
    //  AUDIO  — completar
    // ─────────────────────────────────────────────
    audio: {
        masterVolume: 1.0,
        sfxVolume: 1.0,
        musicVolume: 0.5,
    },

    // ─────────────────────────────────────────────
    //  UI  — completar
    // ─────────────────────────────────────────────
    ui: {
        hudOpacity: 1.0,
    },

} as const;

// Tipos derivados — útiles para tipar funciones que reciben secciones del config
export type ProjectileConfig = typeof GameConfig.projectiles.canion;
export type CoverWallConfig = typeof GameConfig.coverWall;
export type CanionConfig = typeof GameConfig.enemies.canion;