import { getCapacity as lookupCapacity } from './capacities.mjs';

// Capacity data + normalisation now live in ./capacities.mjs (shared with the
// build-time scraper). These thin wrappers keep the app's existing API.

export function getCapacity(shipName: string): number | null {
  return lookupCapacity(shipName);
}

export function estimateCapacity(shipName: string): number {
  return lookupCapacity(shipName) ?? 2500;
}
