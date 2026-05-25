import {
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  type Scene,
  type Mesh,
} from "@babylonjs/core";
import { groundConfig, playGroundStateConfig } from "@/config/GameConfig";
import { type WallGroup } from "./WallGroup";

const CELL_SIZE = 1; // 1x1 unidades de mundo

export interface BuildMap {
  emptyUnits: Vector3[];
}

export function computeBuildMap(
  groups:      WallGroup[],
  extraMeshes: Mesh[] = []
): BuildMap {

  const halfX = groundConfig.width  / 2;
  const halfZ = groundConfig.height / 2;
  const cols  = Math.ceil(groundConfig.width  / CELL_SIZE);
  const rows  = Math.ceil(groundConfig.height / CELL_SIZE);

  const occupied: boolean[][] = Array.from(
    { length: rows }, () => Array(cols).fill(false)
  );

  const toCol = (wx: number): number => Math.floor((wx + halfX) / CELL_SIZE);
  const toRow = (wz: number): number => Math.floor((wz + halfZ) / CELL_SIZE);

  // ── markMesh dentro del scope ──────────────
  const markMesh = (mesh: Mesh): void => {
    mesh.computeWorldMatrix(true);
    const bi   = mesh.getBoundingInfo();
    const minX = bi.boundingBox.minimumWorld.x;
    const maxX = bi.boundingBox.maximumWorld.x;
    const minZ = bi.boundingBox.minimumWorld.z;
    const maxZ = bi.boundingBox.maximumWorld.z;

    const c0 = Math.max(0, toCol(minX));
    const c1 = Math.min(cols - 1, toCol(maxX));
    const r0 = Math.max(0, toRow(minZ));
    const r1 = Math.min(rows - 1, toRow(maxZ));

    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++)
        occupied[r][c] = true;
  };

  // marcar WallGroups
  groups.forEach(group => {
    if (!group.mesh) return;
    markMesh(group.mesh);
  });

  // marcar meshes extra
  extraMeshes.forEach(mesh => markMesh(mesh));

  // calcular emptyUnits
  const emptyUnits: Vector3[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (occupied[r][c]) continue;
      const wx = (c * CELL_SIZE) - halfX + CELL_SIZE / 2;
      const wz = (r * CELL_SIZE) - halfZ + CELL_SIZE / 2;
      emptyUnits.push(new Vector3(wx, 0, wz));
    }
  }

  console.warn(`BuildMap: ${emptyUnits.length} celdas vacías de ${cols * rows} totales`);

  return { emptyUnits };
}


/**
 * Renderiza las celdas vacías como planos 1x1 semitransparentes.
 * Retorna los meshes para poder hacer dispose al regenerar.
 */
export function renderEmptyUnits(buildMap: BuildMap, scene: Scene): Mesh[] {
  const mat = new StandardMaterial("empty_unit_mat", scene);
  mat.diffuseColor    = new Color3(0.0, 0.6, 1.0);
  mat.emissiveColor   = new Color3(0.0, 0.2, 0.4);
  mat.alpha           = 0.3;
  mat.backFaceCulling = false;

  return buildMap.emptyUnits.map((pos, i) => {
    const plane = MeshBuilder.CreateGround(
      `empty_unit_${i}`,
      { width: CELL_SIZE, height: CELL_SIZE, subdivisions: 1 },
      scene
    );
    plane.position.x = pos.x;
    plane.position.y = 0.05;
    plane.position.z = pos.z;
    plane.material   = mat;
    return plane;
  });
}

export interface Area {
  minX:    number;
  maxX:    number;
  minZ:    number;
  maxZ:    number;
  width:   number;
  depth:   number;
  surface: number;
  center:  Vector3;
}

export function areaAssignment(buildMap: BuildMap): Area[] {

  // Valores desde config
  const MIN_SIDE  = playGroundStateConfig.minAreaSide;
  const MAX_AREAS = playGroundStateConfig.maxAreas;

  const halfX = groundConfig.width  / 2;
  const halfZ = groundConfig.height / 2;
  const cols  = Math.ceil(groundConfig.width  / CELL_SIZE);
  const rows  = Math.ceil(groundConfig.height / CELL_SIZE);

  const available: boolean[][] = Array.from(
    { length: rows }, () => Array(cols).fill(false)
  );
  buildMap.emptyUnits.forEach(pos => {
    const c = Math.floor((pos.x + halfX) / CELL_SIZE);
    const r = Math.floor((pos.z + halfZ) / CELL_SIZE);
    if (r >= 0 && r < rows && c >= 0 && c < cols)
      available[r][c] = true;
  });

  const results: Area[] = [];

  for (let iter = 0; iter < MAX_AREAS; iter++) {

    const heights: number[] = Array(cols).fill(0);
    let bestArea  = -1;
    let bestR0 = 0, bestR1 = 0, bestC0 = 0, bestC1 = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++)
        heights[c] = available[r][c] ? heights[c] + 1 : 0;

      const stack: number[] = [];
      for (let c = 0; c <= cols; c++) {
        const h = c < cols ? heights[c] : 0;
        while (stack.length > 0 && h < heights[stack[stack.length - 1]]) {
          if(stack.pop === undefined){
            break;
          }
          const top    = stack.pop() as number;
          const height = heights[top];
          const left   = stack.length > 0 ? stack[stack.length - 1] + 1 : 0;
          const width  = c - left;

          if (height < MIN_SIDE || width < MIN_SIDE) continue;

          const area = height * width;
          if (area > bestArea) {
            bestArea = area;
            bestC0   = left;
            bestC1   = c - 1;
            bestR1   = r;
            bestR0   = r - height + 1;
          }
        }
        stack.push(c);
      }
    }

    if (bestArea < MIN_SIDE * MIN_SIDE) break;

    const wMinX = bestC0 * CELL_SIZE - halfX;
    const wMaxX = (bestC1 + 1) * CELL_SIZE - halfX;
    const wMinZ = bestR0 * CELL_SIZE - halfZ;
    const wMaxZ = (bestR1 + 1) * CELL_SIZE - halfZ;

    const width   = wMaxX - wMinX;
    const depth   = wMaxZ - wMinZ;
    const surface = width * depth;
    const center  = new Vector3((wMinX + wMaxX) / 2, 0, (wMinZ + wMaxZ) / 2);

    results.push({ minX: wMinX, maxX: wMaxX, minZ: wMinZ, maxZ: wMaxZ, width, depth, surface, center });

    for (let r = bestR0; r <= bestR1; r++)
      for (let c = bestC0; c <= bestC1; c++)
        available[r][c] = false;
  }

  results.sort((a, b) => b.surface - a.surface);

  console.warn("── areaAssignment ────────────────────────");
  results.forEach((a, i) =>
    console.warn(`  area[${i}] center(${a.center.x.toFixed(1)}, ${a.center.z.toFixed(1)})  ${a.width.toFixed(0)}x${a.depth.toFixed(0)}  surface:${a.surface.toFixed(0)}`)
  );
  console.warn("──────────────────────────────────────────");

  return results;
}

/**
 * Renderiza las áreas detectadas como planos semitransparentes.
 * Retorna los meshes para poder hacer dispose al regenerar.
 */
export function renderAreas(areas: Area[], scene: Scene): Mesh[] {
  const palette: [number, number, number][] = [
    [0.2, 0.8, 0.2],
    [0.2, 0.4, 1.0],
    [1.0, 0.8, 0.0],
    [0.8, 0.2, 0.8],
    [0.0, 0.9, 0.9],
    [1.0, 0.4, 0.0],
    [0.9, 0.1, 0.3],
    [0.5, 1.0, 0.0],
    [0.0, 0.5, 0.5],
    [1.0, 0.5, 0.8],
  ];

  return areas.map((area, i) => {
    const [r, g, b] = palette[i % palette.length];

    const mat = new StandardMaterial(`area_mat_${i}`, scene);
    mat.diffuseColor    = new Color3(r, g, b);
    mat.emissiveColor   = new Color3(r * 0.4, g * 0.4, b * 0.4);
    mat.alpha           = 0.35;
    mat.backFaceCulling = false;

    const plane = MeshBuilder.CreateGround(
      `area_${i}`,
      { width: area.width, height: area.depth, subdivisions: 1 },
      scene
    );
    plane.position.x = area.center.x;
    plane.position.y = 0.06;
    plane.position.z = area.center.z;
    plane.material   = mat;

    return plane;
  });
}