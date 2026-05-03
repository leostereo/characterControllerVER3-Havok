import { playerConfig, projectilesConfig } from "@/config/GameConfig";
import { EventManager } from "@/game/eventManager/eventManager";
import {
    type Scene,
    type Mesh,
    MeshBuilder,
    StandardMaterial,
    Color3,
    type Vector3,
    PhysicsAggregate,
    PhysicsShapeType,
    type Observer,
    type IPhysicsCollisionEvent,
} from "@babylonjs/core";

interface ProjectileOptions {
    speed: number;
    radius: number;
    maxLifetime: number;
}

const DEFAULT_OPTIONS: ProjectileOptions = {
    speed: projectilesConfig.canion.speed,
    radius: projectilesConfig.canion.radius,
    maxLifetime: projectilesConfig.canion.maxLifetime,
};

export class ProjectileManager {

    private eventManager = EventManager.getInstance();

    constructor(
        private scene: Scene,
        private options: Partial<ProjectileOptions> = {}
    ) { }

    // ─────────────────────────────────────────────
    //  API PÚBLICA
    // ─────────────────────────────────────────────
    throwProjectile(origin: Vector3, direction: Vector3, speed?: number): void {
        const opts = { ...DEFAULT_OPTIONS, ...this.options };
        if (speed) opts.speed = speed;

        const mesh = this.createMesh(opts.radius);
        mesh.position = origin.clone();

        const aggregate = new PhysicsAggregate(
            mesh,
            PhysicsShapeType.BOX,
            { mass: 5, restitution: 0.0, friction: 0.0 },
            this.scene
        );

        const impulse = direction.scale(opts.speed);
        aggregate.body.applyImpulse(impulse, mesh.getAbsolutePosition());

        // ✅ Solo activamos el callback UNA vez que impacta al jugador
        aggregate.body.setCollisionCallbackEnabled(true);
        const collisionObserver = aggregate.body.getCollisionObservable().add((event) => {
            const hitMesh = event.collidedAgainst?.transformNode as Mesh;

            // Ignorar colisiones con el suelo, la pared, etc.
            // Solo reaccionar si golpea al jugador
            if (hitMesh?.name !== playerConfig.player1.player1CollisionDetectableName) return;

            this.onImpact(direction, hitMesh, mesh, aggregate, collisionObserver);
        });

        setTimeout(() => this.destroy(mesh, aggregate, collisionObserver), opts.maxLifetime);
    }


    // ─────────────────────────────────────────────
    //  IMPACTO
    // ─────────────────────────────────────────────
    private onImpact(
        direction: Vector3,
        hitMesh: Mesh | null,
        projectileMesh: Mesh,
        aggregate: PhysicsAggregate,
        collisionObserver: Observer<IPhysicsCollisionEvent>
    ): void {
        if (projectileMesh.isDisposed()) return;

        this.eventManager.emit({
            type: "projectile_hit",
            source: "canion_enemy",
            sourceType: 'enemy',
            data: {
                direction: direction.clone(),   // dirección del proyectil al impactar
                hitMeshName: hitMesh?.name ?? "unknown",
            }
        });

        this.destroy(projectileMesh, aggregate, collisionObserver);
    }

    // ─────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────
    private createMesh(radius: number): Mesh {
        const mesh = MeshBuilder.CreateSphere(
            "projectile",
            { diameter: radius * 2, segments: 6 },
            this.scene
        );
        const mat = new StandardMaterial("projectile_mat", this.scene);
        mat.diffuseColor = new Color3(1.0, 0.4, 0.0);
        mat.emissiveColor = new Color3(1.0, 0.3, 0.0);
        mat.specularColor = new Color3(1, 1, 1);
        mesh.material = mat;
        return mesh;
    }

    private destroy(
        mesh: Mesh,
        aggregate: PhysicsAggregate,
        collisionObserver: Observer<IPhysicsCollisionEvent>
    ): void {
        if (mesh.isDisposed()) return;
        aggregate.body.getCollisionObservable().remove(collisionObserver);
        aggregate.dispose();
        mesh.dispose();
    }
}