// ═══════════════════════════════════════════════════════════════════════
// خدمة التتبع — تتبع القيم من المدخلات إلى المخرجات والعكس
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import { dependencyGraph } from './dependency-graph';
import { LOCKED_REGISTRY } from '@/lib/constants/reference-data';
import type { EngineStep, BlastLoadPath } from '@/types/engine';

export interface TraceEntry {
  variable: string;
  step: EngineStep;
  path: BlastLoadPath | 'shared';
  category: string;
  locked: boolean;
  source: string;
}

export interface TraceChain {
  target: string;
  chain: TraceEntry[];
  lockedEntries: TraceEntry[];
  inputSources: TraceEntry[];
}

export class TraceabilityService {
  /** Trace a variable back to all its input sources */
  traceToInputs(variableName: string): TraceChain {
    const allDeps = dependencyGraph.getAllDependencies(variableName);
    const node = dependencyGraph.getNode(variableName);

    const chain: TraceEntry[] = [];
    const lockedEntries: TraceEntry[] = [];
    const inputSources: TraceEntry[] = [];

    // Add the target itself
    if (node) {
      chain.push({
        variable: node.name,
        step: node.step,
        path: node.path,
        category: node.category,
        locked: LOCKED_REGISTRY.some(e => e.key === node.name),
        source: node.symbol,
      });
    }

    // Add all dependencies
    for (const dep of allDeps) {
      const depNode = dependencyGraph.getNode(dep);
      if (depNode) {
        const entry: TraceEntry = {
          variable: depNode.name,
          step: depNode.step,
          path: depNode.path,
          category: depNode.category,
          locked: LOCKED_REGISTRY.some(e => e.key === depNode.name),
          source: depNode.symbol,
        };
        chain.push(entry);
        if (entry.locked) lockedEntries.push(entry);
        if (entry.category === 'input' || entry.category === 'lookup') inputSources.push(entry);
      }
    }

    return { target: variableName, chain, lockedEntries, inputSources };
  }

  /** Trace from an input to all outputs it affects */
  traceFromInput(variableName: string): TraceEntry[] {
    const allDependents = dependencyGraph.getAllDependents(variableName);
    const result: TraceEntry[] = [];

    for (const dep of allDependents) {
      const node = dependencyGraph.getNode(dep);
      if (node) {
        result.push({
          variable: node.name,
          step: node.step,
          path: node.path,
          category: node.category,
          locked: LOCKED_REGISTRY.some(e => e.key === node.name),
          source: node.symbol,
        });
      }
    }

    return result;
  }

  /** Get all variables that a step produces (for RTM linking) */
  getStepOutputs(step: EngineStep): TraceEntry[] {
    const stepVars = dependencyGraph.getStepVariables(step);
    return stepVars.filter(v => v.category === 'locked' || v.category === 'output').map(v => ({
      variable: v.name,
      step: v.step,
      path: v.path,
      category: v.category,
      locked: LOCKED_REGISTRY.some(e => e.key === v.name),
      source: v.symbol,
    }));
  }
}

export const traceabilityService = new TraceabilityService();
