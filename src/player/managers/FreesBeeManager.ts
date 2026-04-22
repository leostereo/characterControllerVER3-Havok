import { Color3, type Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, StandardMaterial, Vector3, type Scene } from "@babylonjs/core";
import { type ParticlesManager } from "./ParticlesManager";
import { EventManager } from "@/game/eventManager/eventManager";



export class FreesBeeManager {

    private particlesManager: ParticlesManager
    private color: Color3;
    private material: StandardMaterial;
    private eventManager: EventManager = EventManager.getInstance();

    private freesbe_template: Mesh;

    constructor(private scene: Scene, particlesManager: ParticlesManager) {
        this.color = Color3.Blue();
        this.material = new StandardMaterial("freesbe_material", this.scene);
        this.material.emissiveColor = this.color;

        this.freesbe_template = MeshBuilder.CreateCylinder("freesbe_template", { diameter: 0.5, height: 0.1 }, this.scene);
        this.freesbe_template.material = this.material;
        this.freesbe_template.setEnabled(false)

        this.particlesManager = particlesManager;

    }

    public thowFreesbe(position: Vector3, forward: Vector3, rotateVertical = false): void {

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
        // freesbeAggregate.body.setCollisionCallbackEnabled(true)
        // freesbeAggregate.body.getCollisionObservable().add(bodyCollideCB);


        this.eventManager.emit({
            type: "projectile_fired",
            source: "player",
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

    // public throwProjectile(startingPosition: Vector3, impulse: Vector3, damage: number): void {

    //     const projectile = MeshBuilder.CreateSphere('Projectile_' + Date.now(), { diameter: 1 }, this.scene);
    //     projectile.position = startingPosition.clone();
    //     projectile.material = this.material;
    //     //projectile.rotation.y = (Math.PI / 2) - angle;

    //     var projectileAggregate = new PhysicsAggregate(projectile, PhysicsShapeType.SPHERE, { mass: 10, restitution: 0.75 }, this.scene);
    //     projectileAggregate.body.applyImpulse(impulse.scale(damage), projectile.absolutePosition);
    //     projectileAggregate.body.setCollisionCallbackEnabled(true)
    //     projectileAggregate.body.getCollisionObservable().add((collision) => this.bodyCollideCB(collision));

    //     setTimeout(() => {
    //         projectile.dispose()
    //     }, 4000)

    // }

    // private bodyCollideCB(collision: IPhysicsCollisionEvent) {

    //     if (collision.collidedAgainst.transformNode.name.includes('player')) {
    //         console.log(collision.collidedAgainst.transformNode.name);
    //         // this.eventContainer.pushEvent({
    //         //     eventType: 'freesbehit',
    //         //     eventData: {
    //         //         damage: 1,
    //         //         shooter: collision.collider.transformNode.name,
    //         //         target: collision.collidedAgainst.transformNode.name,
    //         //     }
    //         // })
    //     }
    // }


}