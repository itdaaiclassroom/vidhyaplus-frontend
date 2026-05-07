/**
 * ArUco 4×4 Marker Detector
 *
 * Pure JavaScript real-time detector for ArUco markers in video frames.
 * Uses adaptive thresholding, contour detection, perspective correction,
 * and dictionary lookup.
 */

import { lookupPattern, getDictionarySize } from "./arucoGenerator";

export interface DetectedMarker {
  id: number;
  corners: [number, number][]; // 4 corner points [x, y]
}

// ---------------------------------------------------------------------------
// Image processing helpers
// ---------------------------------------------------------------------------

/** Convert RGBA ImageData to grayscale Uint8Array. */
function toGrayscale(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = (r * 77 + g * 150 + b * 29) >> 8;
  }
  return gray;
}

/** Adaptive threshold using mean of a local window. */
function adaptiveThreshold(
  gray: Uint8Array,
  width: number,
  height: number,
  blockSize: number = 15,
  C: number = 7
): Uint8Array {
  const out = new Uint8Array(width * height);
  const half = (blockSize >> 1) | 0;

  // Integral image for fast mean computation
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x];
      integral[(y + 1) * (width + 1) + (x + 1)] =
        integral[y * (width + 1) + (x + 1)] + rowSum;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - half);
      const y0 = Math.max(0, y - half);
      const x1 = Math.min(width - 1, x + half);
      const y1 = Math.min(height - 1, y + half);
      const count = (x1 - x0 + 1) * (y1 - y0 + 1);

      const sum =
        integral[(y1 + 1) * (width + 1) + (x1 + 1)] -
        integral[y0 * (width + 1) + (x1 + 1)] -
        integral[(y1 + 1) * (width + 1) + x0] +
        integral[y0 * (width + 1) + x0];

      const mean = sum / count;
      out[y * width + x] = gray[y * width + x] < mean - C ? 0 : 255;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Contour detection (simplified border following)
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

interface Contour {
  points: Point[];
}

/** Find external contours in a binary image (0 = foreground/black, 255 = background). */
function findContours(binary: Uint8Array, width: number, height: number): Contour[] {
  const visited = new Uint8Array(width * height);
  const contours: Contour[] = [];

  // Direction offsets for 8-connectivity (clockwise from right)
  const dx = [1, 1, 0, -1, -1, -1, 0, 1];
  const dy = [0, 1, 1, 1, 0, -1, -1, -1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (binary[idx] !== 0 || visited[idx]) continue;
      // Check if it's a border pixel (has at least one white neighbor)
      let isBorder = false;
      for (let d = 0; d < 8; d++) {
        const nx = x + dx[d];
        const ny = y + dy[d];
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && binary[ny * width + nx] === 255) {
          isBorder = true;
          break;
        }
      }
      if (!isBorder) continue;

      // Trace the contour using Moore boundary tracing
      const contourPoints: Point[] = [];
      let cx = x,
        cy = y;
      let dir = 0;
      const startX = x,
        startY = y;
      let steps = 0;
      const maxSteps = width * height;

      do {
        contourPoints.push({ x: cx, y: cy });
        visited[cy * width + cx] = 1;

        let found = false;
        for (let i = 0; i < 8; i++) {
          const nd = (dir + i) % 8;
          const nx = cx + dx[nd];
          const ny = cy + dy[nd];
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && binary[ny * width + nx] === 0) {
            cx = nx;
            cy = ny;
            dir = (nd + 5) % 8; // backtrack direction
            found = true;
            break;
          }
        }
        if (!found) break;
        steps++;
      } while ((cx !== startX || cy !== startY) && steps < maxSteps);

      if (contourPoints.length >= 16) {
        contours.push({ points: contourPoints });
      }
    }
  }
  return contours;
}

// ---------------------------------------------------------------------------
// Polygon approximation (Ramer-Douglas-Peucker)
// ---------------------------------------------------------------------------

function perpendicularDist(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function rdp(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpendicularDist(points[i], points[0], points[end]);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, maxIdx + 1), epsilon);
    const right = rdp(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[end]];
}

function approxPolygon(contour: Contour, epsilon: number): Point[] {
  // Close the contour by adding the first point at the end
  const pts = [...contour.points, contour.points[0]];
  const result = rdp(pts, epsilon);
  // Remove the duplicated closing point
  if (
    result.length > 1 &&
    result[0].x === result[result.length - 1].x &&
    result[0].y === result[result.length - 1].y
  ) {
    result.pop();
  }
  return result;
}

// ---------------------------------------------------------------------------
// Perspective transform
// ---------------------------------------------------------------------------

/**
 * Simple perspective warp: sample a quadrilateral region into a flat grid.
 * Uses bilinear interpolation within the quad.
 */
function sampleQuad(
  gray: Uint8Array,
  width: number,
  corners: Point[],
  gridSize: number
): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < gridSize; r++) {
    const row: number[] = [];
    for (let c = 0; c < gridSize; c++) {
      // Normalized coordinates within the quad
      const u = (c + 0.5) / gridSize;
      const v = (r + 0.5) / gridSize;

      // Bilinear interpolation of corner positions
      const x =
        (1 - u) * (1 - v) * corners[0].x +
        u * (1 - v) * corners[1].x +
        u * v * corners[2].x +
        (1 - u) * v * corners[3].x;
      const y =
        (1 - u) * (1 - v) * corners[0].y +
        u * (1 - v) * corners[1].y +
        u * v * corners[2].y +
        (1 - u) * v * corners[3].y;

      const ix = Math.round(x);
      const iy = Math.round(y);
      row.push(gray[iy * width + ix] || 0);
    }
    grid.push(row);
  }
  return grid;
}

/** Order 4 corners: top-left, top-right, bottom-right, bottom-left. */
function orderCorners(pts: Point[]): Point[] {
  // Sort by y first to get top and bottom pairs
  const sorted = [...pts].sort((a, b) => a.y - b.y);
  const top = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = sorted.slice(2, 4).sort((a, b) => a.x - b.x);
  return [top[0], top[1], bottom[1], bottom[0]]; // TL, TR, BR, BL
}

/** Check if a quad is roughly convex and has reasonable proportions. */
function isValidQuad(corners: Point[]): boolean {
  // Check minimum side length
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const len = Math.hypot(corners[j].x - corners[i].x, corners[j].y - corners[i].y);
    if (len < 15) return false; // too small
  }

  // Check aspect ratio (should be roughly square)
  const sides = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    sides.push(Math.hypot(corners[j].x - corners[i].x, corners[j].y - corners[i].y));
  }
  const minSide = Math.min(...sides);
  const maxSide = Math.max(...sides);
  if (maxSide / minSide > 4) return false; // too skewed

  // Check area (should be substantial)
  const area = Math.abs(
    (corners[0].x * (corners[1].y - corners[3].y) +
      corners[1].x * (corners[2].y - corners[0].y) +
      corners[2].x * (corners[3].y - corners[1].y) +
      corners[3].x * (corners[0].y - corners[2].y)) /
      2
  );
  return area > 200;
}

// ---------------------------------------------------------------------------
// Marker identification
// ---------------------------------------------------------------------------

/**
 * Extract the 4×4 inner bit pattern from a sampled 6×6 grid.
 * The outer ring should be all black (border check).
 */
function extractMarkerBits(
  sampledGrid: number[][],
  gridSize: number
): number | null {
  const cellSize = gridSize / 6;

  // Sample the center of each cell
  function sampleCell(row: number, col: number): number {
    const cy = Math.floor((row + 0.5) * cellSize);
    const cx = Math.floor((col + 0.5) * cellSize);
    if (cy >= 0 && cy < gridSize && cx >= 0 && cx < gridSize) {
      return sampledGrid[cy][cx];
    }
    return 0;
  }

  // Check border cells (should be dark/black)
  for (let i = 0; i < 6; i++) {
    // Top and bottom rows
    if (sampleCell(0, i) > 128 || sampleCell(5, i) > 128) return null;
    // Left and right columns
    if (sampleCell(i, 0) > 128 || sampleCell(i, 5) > 128) return null;
  }

  // Read inner 4×4 grid
  let pattern = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = sampleCell(r + 1, c + 1);
      const bitIndex = (3 - r) * 4 + (3 - c);
      if (val > 128) {
        pattern |= 1 << bitIndex;
      }
    }
  }

  return pattern;
}

// ---------------------------------------------------------------------------
// Main detection function
// ---------------------------------------------------------------------------

/**
 * Detect ArUco markers in an ImageData frame.
 *
 * @param imageData - ImageData from canvas.getImageData()
 * @returns Array of detected markers with ID and corner positions
 */
export function detectMarkers(imageData: ImageData): DetectedMarker[] {
  const { width, height, data } = imageData;
  const results: DetectedMarker[] = [];
  const seenIds = new Set<number>();

  // 1. Convert to grayscale
  const gray = toGrayscale(data, width, height);

  // 2. Adaptive threshold
  const binary = adaptiveThreshold(gray, width, height, 15, 7);

  // 3. Find contours
  const contours = findContours(binary, width, height);

  // 4. Process each contour
  for (const contour of contours) {
    // Approximate to polygon
    const perimeter = contour.points.length;
    const epsilon = perimeter * 0.04;
    const poly = approxPolygon(contour, epsilon);

    // Must be a quadrilateral
    if (poly.length !== 4) continue;

    // Order corners consistently
    const ordered = orderCorners(poly);

    // Validate quad shape
    if (!isValidQuad(ordered)) continue;

    // 5. Sample the quad into a flat grid (6×6 cells, sampled at higher resolution)
    const sampleRes = 36; // 6 cells × 6 pixels per cell
    const sampled = sampleQuad(gray, width, ordered, sampleRes);

    // 6. Extract marker bits
    const pattern = extractMarkerBits(sampled, sampleRes);
    if (pattern === null) continue;

    // 7. Look up in dictionary
    const id = lookupPattern(pattern);
    if (id < 0 || id >= getDictionarySize()) continue;

    // Deduplicate
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    results.push({
      id,
      corners: ordered.map((p) => [p.x, p.y] as [number, number]),
    });
  }

  return results;
}
