import { type Area } from "@/playground/builders/BuildMap";
import { playGroundStateConfig } from "@/config/GameConfig";

export interface ClassifiedAreas {
  squares:    Area[];
  rectangles: Area[];
  corridors:  Area[];
}

export function classifyAreas(areas: Area[]): ClassifiedAreas {
  const { squareMaxRatio, corridorMinRatio } = playGroundStateConfig;
  const squares:    Area[] = [];
  const rectangles: Area[] = [];
  const corridors:  Area[] = [];

  for (let index = 0; index < areas.length - 1; index++) {        //smallest area reserved for player1

    const major = Math.max(areas[index].width, areas[index].depth);
    const minor = Math.min(areas[index].width, areas[index].depth);
    const ratio = minor > 0 ? major / minor : Infinity;

    if (ratio < squareMaxRatio) {
      squares.push(areas[index]);
    } else if (ratio < corridorMinRatio) {
      rectangles.push(areas[index]);
    } else {
      corridors.push(areas[index]);
    }
  }

  console.warn("── classifyAreas ─────────────────────────");
  console.warn(`  squares:    ${squares.length}`);
  console.warn(`  rectangles: ${rectangles.length}`);
  console.warn(`  corridors:  ${corridors.length}`);
  console.warn("──────────────────────────────────────────");

  return { squares, rectangles, corridors };
}