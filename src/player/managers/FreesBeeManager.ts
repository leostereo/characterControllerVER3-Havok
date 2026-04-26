import { Color3, type Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, StandardMaterial, Vector3, type Scene } from "@babylonjs/core";
import { EventManager } from "@/game/eventManager/eventManager";
import { type MeshMetadata, meshMetadata, playerConfig } from "@/config/GameConfig";
import { ParticlesManager } from "@/game/effects/ParticlesManager";



export class FreesBeManager {

    private particlesManager: ParticlesManager = ParticlesManager.getInstance();
    private color: Color3;
    private material: StandardMaterial;
    private eventManager: EventManager = EventManager.getInstance();

    private freesbe_template: Mesh;

    constructor(private scene: Scene) {
        this.color = Color3.Blue();
        this.material = new StandardMaterial("freesbe_material", this.scene);
        this.material.emissiveColor = this.color;

        this.freesbe_template = MeshBuilder.CreateCylinder("freesbe_template", { diameter: 0.5, height: 0.1 }, this.scene);
        this.freesbe_template.material = this.material;
        this.freesbe_template.setEnabled(false)

    }

    public throwFreesbe(position: Vector3, forward: Vector3, rotateVertical = false): void {

        const freesbe = this.freesbe_template.clone("freesbe_active");
        freesbe.setEnabled(true); freesbe.material = this.material
        freesbe.position.copyFrom(position);
        freesbe.position.addInPlace(forward.scale(3))
        freesbe.position._y += 1;

        if (rotateVertical) {
            const targetAngle = Math.atan2(-forward.z, forward.x);
            freesbe.rotation = new Vector3(Math.PI / 2, targetAngle, 0)
        }

        const freesbeAggregate = new PhysicsAggregate(freesbe, PhysicsShapeType.BOX, { mass: 10, restitution: 0.75 }, this.scene);
        freesbeAggregate.body.applyImpulse(forward.scale(1000), freesbe.absolutePosition);

        // ✅ Solo nos interesa el primer impacto
        freesbeAggregate.body.setCollisionCallbackEnabled(true);
        const collisionObserver = freesbeAggregate.body.getCollisionObservable().add((event) => {

            const hitMesh = event.collidedAgainst?.transformNode as Mesh;
            if (!hitMesh) return;

            // ✅ Eliminar observer inmediatamente — solo primer impacto
            freesbeAggregate.body.getCollisionObservable().remove(collisionObserver);

            const metadata = hitMesh.metadata as MeshMetadata | null;

            // ✅ Emitir evento según el tipo de mesh golpeado
            if (metadata?.type === meshMetadata.types.enemy) {
                this.eventManager.emit({
                    type: "enemy_damaged",
                    source: playerConfig.player1.name,
                    sourceType: 'player',
                    data: {
                        hitMeshName: hitMesh.name,
                        enemyClass: metadata.enemyClass,
                        direction: forward.clone(),
                        damage: 10,
                    },
                });
            } else {
                // Impacto contra cualquier otra superficie
                this.eventManager.emit({
                    type: "projectile_hit",
                    source: playerConfig.player1.name,
                    sourceType: 'player',
                    data: {
                        hitMeshName: hitMesh.name,
                        direction: forward.clone(),
                    },
                });
            }
        });

        this.eventManager.emit({
            type: "projectile_fired",
            source: "player",

            sourceType: 'player',
            data: {
                position: freesbe.position,
                direction: forward,
                damage: 10,
            },
        });

        this.particlesManager.emitThrowingParticles(freesbe.position, forward)

        setTimeout(() => {
            if (!this.scene.isDisposed) {
                freesbeAggregate.dispose();
                freesbe.dispose();
            }
        }, 4000)

    }


}