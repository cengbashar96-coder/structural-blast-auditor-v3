// ═══════════════════════════════════════════════════════════════════════
// رسم التبعيات — بناء واستعلام رسم التبعيات بين المتغيرات
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

import { UNIFIED_VARIABLE_TABLE } from '@/lib/constants/reference-data';
import type { VariableDefinition, EngineStep, BlastLoadPath } from '@/types/engine';

export interface DependencyNode {
  name: string;
  symbol: string;
  category: VariableDefinition['category'];
  step: EngineStep;
  path: BlastLoadPath | 'shared';
  dependsOn: string[];
  dependedBy: string[];
}

export class DependencyGraph {
  private nodes: Map<string, DependencyNode> = new Map();

  constructor() {
    this.buildFromVariableTable();
  }

  private buildFromVariableTable(): void {
    // First pass: create nodes
    for (const v of UNIFIED_VARIABLE_TABLE) {
      this.nodes.set(v.name, {
        name: v.name,
        symbol: v.symbol,
        category: v.category,
        step: v.step,
        path: v.path,
        dependsOn: [...v.dependsOn],
        dependedBy: [],
      });
    }

    // Second pass: compute dependedBy
    for (const v of UNIFIED_VARIABLE_TABLE) {
      for (const dep of v.dependsOn) {
        const depNode = this.nodes.get(dep);
        if (depNode) {
          depNode.dependedBy.push(v.name);
        }
      }
    }
  }

  /** Get a node by variable name */
  getNode(name: string): DependencyNode | undefined {
    return this.nodes.get(name);
  }

  /** Get all dependencies of a variable (transitive) */
  getAllDependencies(name: string, visited: Set<string> = new Set()): string[] {
    const node = this.nodes.get(name);
    if (!node) return [];

    const result: string[] = [];
    for (const dep of node.dependsOn) {
      if (!visited.has(dep)) {
        visited.add(dep);
        result.push(dep);
        result.push(...this.getAllDependencies(dep, visited));
      }
    }
    return result;
  }

  /** Get all dependents of a variable (what depends on it) */
  getAllDependents(name: string, visited: Set<string> = new Set()): string[] {
    const node = this.nodes.get(name);
    if (!node) return [];

    const result: string[] = [];
    for (const dep of node.dependedBy) {
      if (!visited.has(dep)) {
        visited.add(dep);
        result.push(dep);
        result.push(...this.getAllDependents(dep, visited));
      }
    }
    return result;
  }

  /** Get variables for a specific step */
  getStepVariables(step: EngineStep): DependencyNode[] {
    return Array.from(this.nodes.values()).filter(n => n.step === step);
  }

  /** Get execution order based on dependencies */
  getExecutionOrder(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);
      const node = this.nodes.get(name);
      if (node) {
        for (const dep of node.dependsOn) {
          visit(dep);
        }
        order.push(name);
      }
    };

    for (const name of this.nodes.keys()) {
      visit(name);
    }

    return order;
  }

  /** Detect circular dependencies */
  detectCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (name: string, path: string[]): void => {
      if (recursionStack.has(name)) {
        const cycleStart = path.indexOf(name);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat(name));
        }
        return;
      }
      if (visited.has(name)) return;

      visited.add(name);
      recursionStack.add(name);
      const node = this.nodes.get(name);
      if (node) {
        for (const dep of node.dependsOn) {
          dfs(dep, [...path, name]);
        }
      }
      recursionStack.delete(name);
    };

    for (const name of this.nodes.keys()) {
      dfs(name, []);
    }

    return cycles;
  }
}

export const dependencyGraph = new DependencyGraph();
