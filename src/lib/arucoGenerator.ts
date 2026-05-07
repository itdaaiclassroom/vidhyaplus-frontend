/**
 * ArUco 4×4 Marker Generator
 *
 * Provides:
 * - A pre-computed 4×4_250 dictionary (250 unique markers)
 * - SVG generation for printing on student option cards
 * - ID ↔ (rollNo, answer) mapping
 * - toQrRaw() to produce the string the backend API expects
 *
 * Dictionary is self-consistent: the same patterns are used for
 * both generation (printing cards) and detection (scanning).
 */

// ---------------------------------------------------------------------------
// Bit manipulation helpers
// ---------------------------------------------------------------------------

/**
 * Rotate a 4×4 bit pattern (stored as uint16) 90° clockwise.
 *
 * Grid layout (MSB first):
 *   row0: bits 15 14 13 12
 *   row1: bits 11 10  9  8
 *   row2: bits  7  6  5  4
 *   row3: bits  3  2  1  0
 *
 * After 90° CW rotation, cell (r,c) → (c, 3-r).
 */
function rotate90(pattern: number): number {
  let result = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const srcBit = (3 - r) * 4 + (3 - c);
      const dstR = c;
      const dstC = 3 - r;
      const dstBit = (3 - dstR) * 4 + (3 - dstC);
      if ((pattern >> srcBit) & 1) {
        result |= 1 << dstBit;
      }
    }
  }
  return result & 0xffff;
}

/** Get all 4 rotations of a pattern. */
function allRotations(pattern: number): number[] {
  const rots = [pattern];
  let p = pattern;
  for (let i = 0; i < 3; i++) {
    p = rotate90(p);
    rots.push(p);
  }
  return rots;
}

// ---------------------------------------------------------------------------
// Pre-computed 4×4_250 dictionary
// Generated with: seed=42, min Hamming distance=3, greedy selection
// ---------------------------------------------------------------------------

const DICT_4X4_250: number[] = [
  0x034a, 0x0758, 0x90eb, 0x5a95, 0x7f89, 0x341f, 0x594f, 0x243d, 0x276f, 0x049d,
  0x374e, 0x57ee, 0x09ae, 0x7b0f, 0x1977, 0x3097, 0x35c3, 0x117d, 0x0d79, 0x2946,
  0x1d25, 0x11a5, 0x1efb, 0x37eb, 0x3999, 0x0207, 0x3fc7, 0x33e7, 0x081f, 0x453b,
  0x09d6, 0x02a0, 0x0b6d, 0x2aff, 0x78f9, 0x5fd3, 0x216c, 0x006f, 0x34c6, 0x0690,
  0x1805, 0x07fc, 0x5997, 0x0cf5, 0x001a, 0x0198, 0x598d, 0xbb5f, 0x28ba, 0x253a,
  0xb1bf, 0x782f, 0x918b, 0x2f2d, 0x1c66, 0x128c, 0x01ec, 0x30fb, 0x1e2e, 0x19de,
  0x4d6b, 0x2fa1, 0x5d3f, 0x0d0c, 0x27fa, 0x1a4d, 0x34b3, 0x139b, 0x7a8b, 0x45da,
  0x5abf, 0x16e8, 0x03a8, 0x3f95, 0x032e, 0x1bcd, 0x50da, 0x342c, 0x09fb, 0x970f,
  0x0a7b, 0x0e2b, 0x2f5f, 0x3dae, 0x5369, 0x0591, 0x0a30, 0x1b3a, 0x1f19, 0x156c,
  0x2d77, 0x08c5, 0x1e4b, 0x1cb4, 0x2a96, 0x0537, 0x3e0b, 0xb9bd, 0x4fdd, 0x192f,
  0x511a, 0x550d, 0x419e, 0x23b4, 0x774f, 0x209f, 0x01f7, 0x07d7, 0x1b8e, 0x18be,
  0x1e9f, 0x21dd, 0x779f, 0x100e, 0x1696, 0x127e, 0x1ac3, 0x2fc2, 0x937f, 0x03b1,
  0x1894, 0x5bfb, 0x1aaa, 0x32ce, 0x33e9, 0x344a, 0x232b, 0x0656, 0x3e9a, 0x0bfe,
  0x0f7a, 0x16a5, 0x0951, 0x36d1, 0x1c99, 0x347d, 0x2ddb, 0x13ae, 0x41bd, 0x43cb,
  0x21e2, 0x278e, 0x9e1d, 0x0ed8, 0x7ade, 0x39e3, 0x3ffe, 0x47ab, 0x3359, 0x3c7b,
  0x3de9, 0x0f75, 0x08b7, 0x6fbd, 0x21bc, 0x23ea, 0x799e, 0x1d1d, 0x51a9, 0x0078,
  0x0c07, 0x7ba9, 0x52bd, 0x2de1, 0x524f, 0x35f9, 0x2695, 0x92cf, 0x577a, 0x54bb,
  0x36cf, 0x30bd, 0x3a2a, 0x7eed, 0x5ee7, 0x6119, 0x1a9c, 0x9a39, 0xbadb, 0x99cf,
  0x712e, 0x3b09, 0x02ab, 0x0fa2, 0x02b6, 0x5cab, 0x1f21, 0x1495, 0x919d, 0x1dbb,
  0x6b1d, 0x5cfd, 0x2a3d, 0x3bda, 0xbffb, 0x0f0a, 0x7cdf, 0x578d, 0x2857, 0x03fd,
  0x3b7d, 0x3e3f, 0x12d4, 0x4bd2, 0x18cb, 0x1c78, 0x27a3, 0x3c83, 0x4b3b, 0x20f6,
  0x5d49, 0x3e7c, 0x00e5, 0x09b0, 0x5af3, 0x10b9, 0x0149, 0x0fdc, 0x538f, 0x54d9,
  0x4309, 0x0ff0, 0x318d, 0x58cd, 0x2ff5, 0x3fb2, 0x59ff, 0x0e61, 0x557e, 0x3549,
  0xbb8f, 0x43e1, 0x2af1, 0x5879, 0x0f1f, 0x3e8d, 0x25d1, 0x13a3, 0x16db, 0x4fba,
  0x29a6, 0x2f93, 0x4da5, 0x0a27, 0x5aa1, 0x532a, 0x3239, 0x1009, 0x5e7f, 0x3b6a,
];

// Reverse lookup: any rotation of a pattern → dictionary index (marker ID)
const _patternToId = new Map<number, number>();
DICT_4X4_250.forEach((pattern, id) => {
  for (const rot of allRotations(pattern)) {
    _patternToId.set(rot, id);
  }
});

// ---------------------------------------------------------------------------
// Public API: ID ↔ (rollNo, answer) mapping
// ---------------------------------------------------------------------------

const ANSWER_OPTIONS = ["A", "B", "C", "D"] as const;
export type AnswerOption = (typeof ANSWER_OPTIONS)[number];

/** Convert a student roll number + answer option to an ArUco marker ID. */
export function toArucoId(rollNo: number, option: AnswerOption): number {
  const offset = ANSWER_OPTIONS.indexOf(option);
  // Max dictionary size is 250. 60 slots * 4 options = 240 IDs.
  // We use modulo 60 to safely map large real-world roll numbers into slots.
  const slot = rollNo % 60;
  return slot * 4 + offset;
}

/** Decode an ArUco marker ID back to its original slot + answer option. */
export function fromArucoId(arucoId: number): {
  slot: number;
  answer: AnswerOption;
} {
  return {
    slot: Math.floor(arucoId / 4),
    answer: ANSWER_OPTIONS[arucoId % 4],
  };
}

/**
 * Reconstruct the QR raw string that the backend API expects.
 * Format: "stu{rollNo}_{option}" — e.g. "stu20265001_B"
 * Note: since rollNo can be very large, the detector needs the actual roll number
 * passed in separately if reconstructing this string precisely, or just the
 * option extracted if matching against a known list of expected students.
 */
export function toQrRaw(rollNo: number, arucoId: number): string {
  const { answer } = fromArucoId(arucoId);
  return `stu${rollNo}_${answer}`;
}

// ---------------------------------------------------------------------------
// Public API: Marker pattern access (for detector)
// ---------------------------------------------------------------------------

/** Get the raw 4×4 bit pattern (uint16) for a marker ID. */
export function getMarkerBits(id: number): number {
  if (id < 0 || id >= DICT_4X4_250.length) {
    throw new Error(`ArUco ID ${id} out of range (0-${DICT_4X4_250.length - 1})`);
  }
  return DICT_4X4_250[id];
}

/** Get the 4×4 grid as a 2D array (0 = black, 1 = white). Row-major. */
export function getMarkerGrid(id: number): number[][] {
  const bits = getMarkerBits(id);
  const grid: number[][] = [];
  for (let r = 0; r < 4; r++) {
    const row: number[] = [];
    for (let c = 0; c < 4; c++) {
      const bitIndex = (3 - r) * 4 + (3 - c);
      row.push((bits >> bitIndex) & 1);
    }
    grid.push(row);
  }
  return grid;
}

/** Look up a detected 16-bit pattern → marker ID (or -1 if not found). */
export function lookupPattern(pattern: number): number {
  return _patternToId.get(pattern & 0xffff) ?? -1;
}

/** Total number of markers in the dictionary. */
export function getDictionarySize(): number {
  return DICT_4X4_250.length;
}

// ---------------------------------------------------------------------------
// Public API: SVG generation
// ---------------------------------------------------------------------------

/**
 * Generate an SVG string for a 4×4 ArUco marker.
 *
 * The rendered marker is a 6×6 grid:
 * - 1-cell black border on all sides
 * - 4×4 inner grid from the dictionary pattern
 *
 * @param id - Marker ID (0-249)
 * @param size - SVG width/height in pixels (default 200)
 */
export function generateArucoSvg(id: number, size: number = 200): string {
  const grid = getMarkerGrid(id);
  const cells = 6; // 4 inner + 2 border
  const cellSize = size / cells;

  let rects = "";

  // Draw white cells only (background is black)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 1) {
        const x = (c + 1) * cellSize;
        const y = (r + 1) * cellSize;
        rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="white"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    `<rect x="0" y="0" width="${size}" height="${size}" fill="black"/>` +
    rects +
    `</svg>`;
}
