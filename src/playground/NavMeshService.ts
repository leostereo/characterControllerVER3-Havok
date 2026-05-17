import {
    Color3,
    type LinesMesh,
    MeshBuilder,
    type Scene,
    Vector3,
    type Observer,
} from "@babylonjs/core";
import { init, type NavMesh, Crowd, NavMeshQuery, type CrowdAgent } from "recast-navigation";
import { generateTiledNavMesh } from "recast-navigation/generators";
import { PlayGroundState } from "./state/PlayGroundState";


export interface AgentConfig {
    radius: number;
    height: number;
    maxAcceleration: number;
    maxSpeed: number;
    collisionQueryRange: number;
    separationWeight: number;
}

const NAVMESH_TILED_CONFIG = {
    cs: 0.2,
    ch: 0.2,
    walkableSlopeAngle: 45,
    walkableHeight: 1.8,
    walkableClimb: 0.2,
    walkableRadius: 0,
    tileSize: 32,
    maxEdgeLen: 16,
    maxSimplificationError: 1.3,
    minRegionArea: 0,
    mergeRegionArea: 0,
    maxVertsPerPoly: 6,
    detailSampleDist: 6,
    detailSampleMaxError: 1,
} as const;

export class NavMeshService {

    private static instance: NavMeshService | null = null;

    private navMesh!: NavMesh;
    private navMeshQuery!: NavMeshQuery;
    private crowd!: Crowd;
    private ready = false;
    private nextAgentId = 0;
    private agents = new Map<number, CrowdAgent>();
    private debugPathLine: LinesMesh | null = null;
    private renderObserver: Observer<Scene> | null = null;

    private constructor(private scene: Scene) { }

    // ─────────────────────────────────────────────
    //  SINGLETON
    // ─────────────────────────────────────────────
    static getInstance(scene: Scene): NavMeshService {
        return NavMeshService.instance ??= new NavMeshService(scene);
    }

    // ─────────────────────────────────────────────
    //  INICIALIZACIÓN
    // ─────────────────────────────────────────────
    async build(): Promise<void> {
        await init();

        const points = PlayGroundState.getInstance().getEmptyPoints();
        if (points.length === 0) {
            throw new Error("NavMeshService: no hay puntos navegables en PlayGroundState.");
        }

        const geometry = this.buildGeometry(points);
        if (geometry.positions.length === 0 || geometry.indices.length === 0) {
            throw new Error("NavMeshService: geometría vacía al construir el navmesh.");
        }

        const positions = new Float32Array(geometry.positions);
        const indices = new Uint32Array(geometry.indices);

        const navMeshResult = generateTiledNavMesh(positions, indices, NAVMESH_TILED_CONFIG);

        if (!navMeshResult.success) {
            throw new Error(`NavMeshService: falló la generación del NavMesh. ${navMeshResult.error ?? "Sin detalle de error."}`);
        }

        const { navMesh } = navMeshResult;

        this.navMesh = navMesh;
        this.navMeshQuery = new NavMeshQuery(navMesh);
        this.crowd = new Crowd(navMesh, {
            maxAgents: 50,
            maxAgentRadius: 0.5,
        });

        this.ready = true;
        this.startLoop();
    }

    // ─────────────────────────────────────────────
    //  API PÚBLICA
    // ─────────────────────────────────────────────
    addAgent(position: Vector3, config: AgentConfig): number {
        this.assertReady();
        const agent = this.crowd.addAgent(
            { x: position.x, y: 0, z: position.z },
            {
        radius: config.radius,
        height: config.height,
        maxAcceleration: config.maxAcceleration,
        maxSpeed: config.maxSpeed,
        collisionQueryRange: config.collisionQueryRange,
        pathOptimizationRange: 0,
          separationWeight: config.separationWeight,
      }
  );

    const agentId = this.nextAgentId++;
    this.agents.set(agentId, agent);
    return agentId;
}

    removeAgent(index: number): void {
        this.assertReady();
        const agent = this.getAgent(index);
        if (!agent) return;

        this.crowd.removeAgent(agent);
        this.agents.delete(index);
    }

    setAgentTarget(index: number, target: Vector3): void {
        this.assertReady();
        const agent = this.getAgent(index);
        if (!agent) return;

        agent.requestMoveTarget({ x: target.x, y: 0, z: target.z });
    }

    getAgentPosition(index: number): Vector3 | null {
        this.assertReady();
        const agent = this.getAgent(index);
        if (!agent) return null;

        const position = agent.position();
        return new Vector3(position.x, 0, position.z);
    }

    getAgentVelocity(index: number): Vector3 | null {
        this.assertReady();
        const agent = this.getAgent(index);
        if (!agent) return null;

        const velocity = agent.velocity();
        return new Vector3(velocity.x, 0, velocity.z);
    }

    computePath(from: Vector3, to: Vector3): Vector3[] {
        this.assertReady();
        const { success, path } = this.navMeshQuery.computePath(
            { x: from.x, y: 0, z: from.z },
            { x: to.x, y: 0, z: to.z }
        );

        if (!success) return [];

        return path.map(p => new Vector3(p.x, 0, p.z));
    }

    isReady(): boolean { return this.ready; }

    dispose(): void {
        if (this.renderObserver) {
            this.scene.onBeforeRenderObservable.remove(this.renderObserver);
            this.renderObserver = null;
        }
        this.crowd.destroy();
        this.navMeshQuery.destroy();
        this.navMesh.destroy();
        this.clearDebugPath();
        this.agents.clear();
        this.ready = false;
        NavMeshService.instance = null;
    }

    // ─────────────────────────────────────────────
    //  LOOP
    // ─────────────────────────────────────────────
    private startLoop(): void {
        this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
            const dt = this.scene.getEngine().getDeltaTime() / 1000;
            this.crowd.update(dt);
        });
    }

    // ─────────────────────────────────────────────
    //  GEOMETRÍA
    // ─────────────────────────────────────────────
    private buildGeometry(points: Vector3[]): {
        positions: number[];
        indices: number[];
    } {
        const positions: number[] = [];
        const indices: number[] = [];

        points.forEach((point, i) => {
            const base = i * 4;
            const { x, z } = point;

            positions.push(
                x - 0.5, 0, z - 0.5,   // 0 — bottom left
                x + 0.5, 0, z - 0.5,   // 1 — bottom right
                x + 0.5, 0, z + 0.5,   // 2 — top right
                x - 0.5, 0, z + 0.5,   // 3 — top left
            );

            // invertido — antihorario visto desde arriba
            indices.push(
                base, base + 2, base + 1,   // ← era base, base+1, base+2
                base, base + 3, base + 2,   // ← era base, base+2, base+3
            );
        });

        return { positions, indices };
    }

    getRandomPoint(): { success: boolean; randomPoint: Vector3 } {
        this.assertReady();

        // findRandomPoint sin argumentos a veces falla — usamos findRandomPointAroundCircle
        const origin = { x: 0, y: 0, z: 0 };
        const { success, randomPoint } = this.navMeshQuery.findRandomPointAroundCircle(
            origin,
            50  // radio — la mitad del mapa
        );

        // console.warn("findRandomPointAroundCircle:", success, randomPoint);

        return {
            success,
            randomPoint: new Vector3(randomPoint.x, 0, randomPoint.z),
        };
    }

    drawDebugPath(from: Vector3, to: Vector3, yOffset = 0.15): Vector3[] {
        this.assertReady();
        this.clearDebugPath();

        const path = this.computePath(from, to).map((p) => new Vector3(p.x, p.y + yOffset, p.z));
        if (path.length < 2) return path;

        this.debugPathLine = MeshBuilder.CreateLines(
            "navmesh_debug_path",
            { points: path },
            this.scene
        );
        this.debugPathLine.color = new Color3(0.05, 1, 0.85);

        return path;
    }

    clearDebugPath(): void {
        if (!this.debugPathLine) return;
        this.debugPathLine.dispose();
        this.debugPathLine = null;
    }

    // ─────────────────────────────────────────────
    //  GUARD
    // ─────────────────────────────────────────────
    private assertReady(): void {
        if (!this.ready) throw new Error("NavMeshService: build() no fue llamado.");
    }

    private getAgent(index: number): CrowdAgent | null {
        return this.agents.get(index) ?? null;
    }
}