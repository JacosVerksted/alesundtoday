export type BusynessLevel = 'quiet' | 'moderate' | 'busy' | 'very-busy';

export const CAPACITY: Record<string, number>;
export const PAX_MODERATE_MAX: number;
export const PAX_BUSY_MAX: number;

export function normalize(name: string): string;
export function getCapacity(shipName: string): number | null;
export function levelForPax(totalPax: number): BusynessLevel;
export function levelForCount(count: number): BusynessLevel;
export function dayLevel(ships: string[]): { pax: number | null; level: BusynessLevel };
