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

  areas.forEach(area => {
    const major = Math.max(area.width, area.depth);
    const minor = Math.min(area.width, area.depth);
    const ratio = minor > 0 ? major / minor : Infinity;

    if (ratio < squareMaxRatio) {
      squares.push(area);
    } else if (ratio < corridorMinRatio) {
      rectangles.push(area);
    } else {
      corridors.push(area);
    }
  });

  console.warn("── classifyAreas ─────────────────────────");
  console.warn(`  squares:    ${squares.length}`);
  console.warn(`  rectangles: ${rectangles.length}`);
  console.warn(`  corridors:  ${corridors.length}`);
  console.warn("──────────────────────────────────────────");

  return { squares, rectangles, corridors };
}