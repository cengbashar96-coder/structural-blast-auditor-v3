// ═══════════════════════════════════════════════════════════════════════
// مدير القيم المقفلة — التتبع والانحراف والتجمد
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import { LOCKED_REGISTRY, FINAL_LOCKED_RESULTS } from '@/lib/constants/reference-data';
import type { LockedValueEntry, EngineStep, BlastLoadPath } from '@/types/engine';

export interface LockedValueSnapshot {
  key: string;
  value: number;
  producedByStep: EngineStep;
  consumedBySteps: EngineStep[];
  path: BlastLoadPath | 'shared';
  tolerance: number;
  currentComputed?: number;
  deviationPct?: number;
  status: 'OK' | 'DEVIATED' | 'MISSING';
  frozenAt: string;
}

export class LockedValuesManager {
  private snapshots: Map<string, LockedValueSnapshot> = new Map();
  private frozen: boolean = false;

  constructor() {
    this.initializeFromRegistry();
  }

  private initializeFromRegistry(): void {
    for (const entry of LOCKED_REGISTRY) {
      this.snapshots.set(entry.key, {
        ...entry,
        status: 'OK',
        frozenAt: new Date().toISOString(),
      });
    }
  }

  /** Check if a computed value deviates from the locked reference */
  checkDeviation(key: string, computed: number): LockedValueSnapshot {
    const entry = LOCKED_REGISTRY.find(e => e.key === key);
    if (!entry) {
      return {
        key, value: 0, producedByStep: 2, consumedBySteps: [], path: 'shared', tolerance: 0,
        currentComputed: computed, deviationPct: 100, status: 'MISSING',
        frozenAt: new Date().toISOString(),
      };
    }
    const deviation = Math.abs(computed - entry.value);
    const devPct = (deviation / Math.abs(entry.value)) * 100;
    const status = devPct <= entry.tolerance * 100 ? 'OK' : 'DEVIATED';

    return {
      ...entry,
      currentComputed: computed,
      deviationPct: devPct,
      status,
      frozenAt: new Date().toISOString(),
    };
  }

  /** Check all locked values against a set of computed values */
  checkAllDeviations(computed: Record<string, number>): LockedValueSnapshot[] {
    const results: LockedValueSnapshot[] = [];
    for (const entry of LOCKED_REGISTRY) {
      const calcVal = computed[entry.key];
      if (calcVal !== undefined) {
        results.push(this.checkDeviation(entry.key, calcVal));
      }
    }
    return results;
  }

  /** Get all locked values as a plain object */
  getAllLocked(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const entry of LOCKED_REGISTRY) {
      result[entry.key] = entry.value;
    }
    return result;
  }

  /** Get locked values produced by a specific step */
  getByProducer(step: EngineStep): LockedValueSnapshot[] {
    return Array.from(this.snapshots.values()).filter(s => s.producedByStep === step);
  }

  /** Get locked values consumed by a specific step */
  getByConsumer(step: EngineStep): LockedValueSnapshot[] {
    return Array.from(this.snapshots.values()).filter(s => s.consumedBySteps.includes(step));
  }

  /** Get locked values for a specific path */
  getByPath(path: BlastLoadPath | 'shared'): LockedValueSnapshot[] {
    return Array.from(this.snapshots.values()).filter(s => s.path === path);
  }

  /** Freeze all values — after this, no recalculation is allowed */
  freeze(): void {
    this.frozen = true;
  }

  /** Check if values are frozen */
  isFrozen(): boolean {
    return this.frozen;
  }

  /** Get the final locked results */
  getFinalResults(): typeof FINAL_LOCKED_RESULTS {
    return FINAL_LOCKED_RESULTS;
  }
}

// Singleton
export const lockedValuesManager = new LockedValuesManager();
