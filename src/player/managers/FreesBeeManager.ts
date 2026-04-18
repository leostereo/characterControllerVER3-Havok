import { AbstractMesh, Color3, IPhysicsCollisionEvent, MeshBuilder, PhysicsAggregate, PhysicsShapeType, StandardMaterial, Vector3, type Scene } from "@babylonjs/core";

type NewType = StandardMaterial;

export class FreesBeeManager {

    private color: Color3;
    private material: NewType;

    constructor(private scene: Scene) {
        this.color = Color3.Blue();
        this.material = new StandardMaterial("freesbe_material", this.scene);
        this.material.emissiveColor = this.color;
    }

    public thowFreesbe(position: Vector3, forward: Vector3, rotateVertical = false) {

        const freesbe = MeshBuilder.CreateCylinder('freesbe', { diameter: 0.5, height: 0.1 })
        freesbe.material = this.material
        freesbe.position = position.clone();
        freesbe.position.addInPlace(forward.scale(3))
        freesbe.position._y += 1;
        

        const emiterPosition = freesbe.position.clone();
        emiterPosition.subtractInPlace(forward.scale(4))
        emiterPosition._y = + 1;

        const emiterOrientation = {
            position: emiterPosition,
            pointingVector: forward
        }

        if (rotateVertical) {
            const targetAngle = Math.atan2(-forward.z,
                forward.x);
            freesbe.rotation = new Vector3(Math.PI / 2, targetAngle, 0)
        }

        // new ParticlesEmiter(this.scene, emiterOrientation, 10, 'throw', this.color);

        var freesbeAggregate = new PhysicsAggregate(freesbe, PhysicsShapeType.BOX, { mass: 10, restitution: 0.75 }, this.scene);
        freesbeAggregate.body.applyImpulse(forward.scale(1000), freesbe.absolutePosition);
        // freesbeAggregate.body.setCollisionCallbackEnabled(true)
        // freesbeAggregate.body.getCollisionObservable().add(bodyCollideCB);

        setTimeout(() => {
            freesbe.dispose()
        }, 4000)

    }

    public throwProjectile(startingPosition: Vector3, impulse: Vector3, damage: number): void {

        const projectile = MeshBuilder.CreateSphere('Projectile_' + Date.now(), { diameter: 1 }, this.scene);
        projectile.position = startingPosition.clone();
        projectile.material = this.material;
        //projectile.rotation.y = (Math.PI / 2) - angle;

        var projectileAggregate = new PhysicsAggregate(projectile, PhysicsShapeType.SPHERE, { mass: 10, restitution: 0.75 }, this.scene);
        projectileAggregate.body.applyImpulse(impulse.scale(damage), projectile.absolutePosition);
        projectileAggregate.body.setCollisionCallbackEnabled(true)
        projectileAggregate.body.getCollisionObservable().add((collision) => this.bodyCollideCB(collision));

        setTimeout(() => {
            projectile.dispose()
        }, 4000)

    }

    private bodyCollideCB(collision: IPhysicsCollisionEvent) {

        if (collision.collidedAgainst.transformNode.name.includes('player')) {
            console.log(collision.collidedAgainst.transformNode.name);
            // this.eventContainer.pushEvent({
            //     eventType: 'freesbehit',
            //     eventData: {
            //         damage: 1,
            //         shooter: collision.collider.transformNode.name,
            //         target: collision.collidedAgainst.transformNode.name,
            //     }
            // })
        }
    }
}