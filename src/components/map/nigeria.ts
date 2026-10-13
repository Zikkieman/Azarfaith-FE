/**
 * A light-weight dot map of Nigeria: a simplified outline (lon, lat) plus the 36 states and FCT
 * as centre points. Each dot inside the outline belongs to its nearest state centre, which gives
 * believable state regions without shipping GeoJSON.
 */

type LonLat = [number, number];

const outline: LonLat[] = [
  [2.7, 6.37],
  [2.72, 6.9],
  [2.75, 7.9],
  [2.69, 8.5],
  [3.1, 9.1],
  [3.6, 10.3],
  [3.6, 11.0],
  [3.65, 11.7],
  [4.1, 13.5],
  [4.9, 13.7],
  [5.5, 13.9],
  [6.4, 13.6],
  [7.0, 13.0],
  [7.8, 13.3],
  [8.5, 13.1],
  [9.0, 12.8],
  [10.0, 13.2],
  [11.0, 13.4],
  [12.2, 13.1],
  [13.0, 13.6],
  [13.6, 13.7],
  [14.2, 13.1],
  [14.5, 12.4],
  [14.2, 11.6],
  [13.6, 10.9],
  [13.3, 10.2],
  [13.2, 9.5],
  [12.8, 8.8],
  [12.2, 8.4],
  [11.8, 7.2],
  [11.1, 6.5],
  [10.6, 7.0],
  [9.8, 6.5],
  [9.5, 6.0],
  [8.9, 5.0],
  [8.5, 4.6],
  [8.3, 4.5],
  [7.5, 4.4],
  [7.0, 4.4],
  [6.5, 4.3],
  [6.0, 4.3],
  [5.6, 4.9],
  [5.2, 5.5],
  [4.6, 6.2],
  [4.0, 6.4],
  [3.4, 6.4],
];

export const states: { id: string; name: string; at: LonLat }[] = [
  { id: "AB", name: "Abia", at: [7.5, 5.45] },
  { id: "AD", name: "Adamawa", at: [12.4, 9.3] },
  { id: "AK", name: "Akwa Ibom", at: [7.85, 5.0] },
  { id: "AN", name: "Anambra", at: [6.95, 6.2] },
  { id: "BA", name: "Bauchi", at: [10.0, 10.75] },
  { id: "BY", name: "Bayelsa", at: [6.1, 4.75] },
  { id: "BE", name: "Benue", at: [8.75, 7.35] },
  { id: "BO", name: "Borno", at: [13.0, 11.8] },
  { id: "CR", name: "Cross River", at: [8.6, 5.9] },
  { id: "DE", name: "Delta", at: [5.9, 5.5] },
  { id: "EB", name: "Ebonyi", at: [8.0, 6.25] },
  { id: "ED", name: "Edo", at: [5.9, 6.6] },
  { id: "EK", name: "Ekiti", at: [5.25, 7.7] },
  { id: "EN", name: "Enugu", at: [7.4, 6.55] },
  { id: "FC", name: "FCT Abuja", at: [7.2, 8.85] },
  { id: "GO", name: "Gombe", at: [11.2, 10.3] },
  { id: "IM", name: "Imo", at: [7.05, 5.5] },
  { id: "JI", name: "Jigawa", at: [9.5, 12.2] },
  { id: "KD", name: "Kaduna", at: [7.7, 10.4] },
  { id: "KN", name: "Kano", at: [8.5, 11.8] },
  { id: "KT", name: "Katsina", at: [7.6, 12.6] },
  { id: "KE", name: "Kebbi", at: [4.2, 11.6] },
  { id: "KO", name: "Kogi", at: [6.6, 7.8] },
  { id: "KW", name: "Kwara", at: [4.7, 8.8] },
  { id: "LA", name: "Lagos", at: [3.55, 6.55] },
  { id: "NA", name: "Nasarawa", at: [8.3, 8.5] },
  { id: "NI", name: "Niger", at: [5.7, 10.0] },
  { id: "OG", name: "Ogun", at: [3.35, 7.0] },
  { id: "ON", name: "Ondo", at: [5.1, 7.0] },
  { id: "OS", name: "Osun", at: [4.55, 7.55] },
  { id: "OY", name: "Oyo", at: [3.6, 8.1] },
  { id: "PL", name: "Plateau", at: [9.6, 9.2] },
  { id: "RI", name: "Rivers", at: [6.85, 4.85] },
  { id: "SO", name: "Sokoto", at: [5.3, 13.0] },
  { id: "TA", name: "Taraba", at: [10.8, 7.9] },
  { id: "YO", name: "Yobe", at: [11.6, 12.3] },
  { id: "ZA", name: "Zamfara", at: [6.2, 12.1] },
];

const LON0 = 2.5;
const LAT0 = 14.0;
/** Map units per degree. The SVG viewBox is built from these. */
export const UNIT = 40;
export const VIEW = { w: (14.7 - LON0) * UNIT, h: (LAT0 - 4.1) * UNIT };

export const project = ([lon, lat]: LonLat) => ({ x: (lon - LON0) * UNIT, y: (LAT0 - lat) * UNIT });

function inside([x, y]: LonLat) {
  let hit = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i];
    const [xj, yj] = outline[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export type Dot = { x: number; y: number; state: string };

/** Every dot on the map, tagged with the state it belongs to. Computed once. */
export const dots: Dot[] = (() => {
  const out: Dot[] = [];
  const step = 0.2;
  for (let lat = 4.2; lat <= 13.95; lat += step) {
    // Offset alternate rows for a softer, hex-like texture.
    const shift = Math.round((lat - 4.2) / step) % 2 ? step / 2 : 0;
    for (let lon = 2.6 + shift; lon <= 14.6; lon += step) {
      if (!inside([lon, lat])) continue;
      let best = states[0];
      let bestD = Infinity;
      for (const s of states) {
        const d = (s.at[0] - lon) ** 2 + (s.at[1] - lat) ** 2;
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      out.push({ ...project([lon, lat]), state: best.id });
    }
  }
  // Drop stray edge dots (fewer than two neighbours) left by the simplified outline.
  const r2 = (step * UNIT * 1.15) ** 2;
  return out.filter(
    (d) => out.filter((o) => o !== d && (o.x - d.x) ** 2 + (o.y - d.y) ** 2 <= r2).length >= 2,
  );
})();

/** The state under a map-space point, or null outside Nigeria (same rule the dots use). */
export function stateAt(x: number, y: number): string | null {
  const lon = x / UNIT + LON0;
  const lat = LAT0 - y / UNIT;
  if (!inside([lon, lat])) return null;
  let best = states[0];
  let bestD = Infinity;
  for (const s of states) {
    const d = (s.at[0] - lon) ** 2 + (s.at[1] - lat) ** 2;
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best.id;
}
