// ═══════════════════════════════════════════════════════════════════════
// طبقة التخزين المحلي - Dexie / IndexedDB
// منصة المدقق الديناميكي الموحد V3.0
// إدارة حالة التطبيق وحفظ مشاريع التدقيق محلياً (Offline-First)
// ═══════════════════════════════════════════════════════════════════════

import Dexie, { type Table } from 'dexie';

// ─── واجهات البيانات ───

export interface AuditProject {
  id?: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  bombId: number;
  explosiveName: string;
  soilName: string;
  fallVelocity: number;
  fallAngle: number;
  ceilingDepth: number;
  tunnelSpanShort: number;
  tunnelSpanLong: number;
  ceilingHeight: number;
  designMethod: 'SYRIAN_WSD_2024' | 'USD_GLOBAL';
  f_c: number;
  f_y: number;
  h_slab: number;
  b_column: number;
  h_column: number;
  a_tributary: number;
}

export interface BlastResult {
  id?: number;
  projectId: number;
  createdAt: Date;
  h_penetration: number;
  C_effective: number;
  sigma_max: number;
  tau_effective: number;
  P_design: number;
  P_design_kPa: number;
  H_roof: number;
  H_wall: number;
  H_floor: number;
  dynamicConditionMet: boolean;
  coreConditionMet: boolean;
}

export interface StructuralResult {
  id?: number;
  projectId: number;
  createdAt: Date;
  status: 'SUCCESS' | 'PUNCHING_FAILURE' | 'CRITICAL_ERROR';
  d_eff: number;
  b_0: number;
  eccentricity: number;
  e_limit: number;
  svgColor: 'GREEN' | 'RED_FLASHING';
  rho_final: number;
  v_actual?: number;
  v_cd?: number;
  errorMessage?: string;
}

export interface AppSettings {
  id?: number;
  key: string;
  value: string;
  updatedAt: Date;
}

// ─── قاعدة البيانات ───

class StructuralDatabase extends Dexie {
  projects!: Table<AuditProject>;
  blastResults!: Table<BlastResult>;
  structuralResults!: Table<StructuralResult>;
  settings!: Table<AppSettings>;

  constructor() {
    super('StructuralAuditorV3');
    
    this.version(1).stores({
      projects: '++id, name, createdAt, updatedAt',
      blastResults: '++id, projectId, createdAt',
      structuralResults: '++id, projectId, createdAt',
      settings: '++id, &key',
    });
  }
}

// Singleton instance
export const db = new StructuralDatabase();

// ─── عمليات CRUD ───

export async function createProject(data: Omit<AuditProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date();
  return await db.projects.add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
}

export async function getProject(id: number): Promise<AuditProject | undefined> {
  return await db.projects.get(id);
}

export async function getAllProjects(): Promise<AuditProject[]> {
  return await db.projects.orderBy('updatedAt').reverse().toArray();
}

export async function updateProject(id: number, data: Partial<AuditProject>): Promise<void> {
  await db.projects.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteProject(id: number): Promise<void> {
  await db.transaction('rw', [db.projects, db.blastResults, db.structuralResults], async () => {
    await db.blastResults.where('projectId').equals(id).delete();
    await db.structuralResults.where('projectId').equals(id).delete();
    await db.projects.delete(id);
  });
}

export async function saveBlastResult(data: Omit<BlastResult, 'id' | 'createdAt'>): Promise<number> {
  return await db.blastResults.add({ ...data, createdAt: new Date() });
}

export async function getBlastResults(projectId: number): Promise<BlastResult[]> {
  return await db.blastResults.where('projectId').equals(projectId).toArray();
}

export async function saveStructuralResult(data: Omit<StructuralResult, 'id' | 'createdAt'>): Promise<number> {
  return await db.structuralResults.add({ ...data, createdAt: new Date() });
}

export async function getStructuralResults(projectId: number): Promise<StructuralResult[]> {
  return await db.structuralResults.where('projectId').equals(projectId).toArray();
}

export async function getLatestStructuralResult(projectId: number): Promise<StructuralResult | undefined> {
  const results = await db.structuralResults
    .where('projectId')
    .equals(projectId)
    .reverse()
    .sortBy('createdAt');
  return results[0];
}

export async function saveSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where('key').equals(key).first();
  if (existing) {
    await db.settings.update(existing.id!, { value, updatedAt: new Date() });
  } else {
    await db.settings.add({ key, value, updatedAt: new Date() });
  }
}

export async function getSetting(key: string): Promise<string | undefined> {
  const setting = await db.settings.where('key').equals(key).first();
  return setting?.value;
}
