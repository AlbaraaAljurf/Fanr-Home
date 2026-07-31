import { FinishGrade } from "./types";

/**
 * Versioned hedonic factor set (PRD §7.2 Layer 2 initial priors).
 * Stored as config, never hard-coded inline — replaced by fitted coefficients
 * once ≥5,000 transactions per city are ingested.
 */
export const AVM_FACTOR_SET = {
  version: "priors-v1",
  age: (years: number) =>
    years <= 0 ? 1.05 : years <= 5 ? 1.0 : years <= 10 ? 0.94 : years <= 20 ? 0.86 : years <= 30 ? 0.78 : 0.72,
  finish: { economy: 0.82, standard: 1.0, premium: 1.15, luxury: 1.3 } as Record<FinishGrade, number>,
  streetWidth: (m: number) => (m < 10 ? 0.94 : m <= 15 ? 1.0 : m <= 20 ? 1.05 : m <= 30 ? 1.09 : 1.12),
  corner: (isCorner: boolean) => (isCorner ? 1.06 : 1.0),
  orientation: { north: 1.04, east: 1.02, west: 0.99, south: 0.97 } as Record<string, number>,
  floorApartment: (floor: number | null, elevator: boolean) => {
    if (floor === null) return 1.0;
    if (floor === 0) return 0.95;
    if (floor <= 3) return 1.0;
    if (!elevator) return 0.93;
    return floor <= 7 ? 1.03 : 1.06;
  },
  elevatorPenalty: (floors: number | null, elevator: boolean) =>
    floors !== null && floors >= 4 && !elevator ? 0.9 : 1.0,
  parking: (spaces: number) => (spaces === 0 ? 0.96 : spaces >= 2 ? 1.04 : 1.0),
};
