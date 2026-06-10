// ═══════════════════════════════════════════════════════════════════════
// Unified Export - نظام التخزين الفرعي المتكامل
// منصة المدقق الديناميكي الموحد V3.0
// ═══════════════════════════════════════════════════════════════════════

// ─── قاعدة البيانات والمخططات ───
export { db, StructuralBlastDB } from './db';
export {
  ProjectRecordSchema,
  ScenarioRecordSchema,
  RtmRecordSchema,
  SyncQueueRecordSchema,
  RTM_TEST_CASE_IDS,
  SYNC_ACTIONS,
  SYNC_PAYLOAD_TYPES,
  validateBeforeWrite,
  safeParseWithDefaults,
  type ProjectRecord,
  type ScenarioRecord,
  type RtmRecord,
  type SyncQueueRecord,
  type RtmTestCaseId,
  type SyncAction,
  type SyncPayloadType,
} from './storageSchemas';

// ─── طبقة المستودعات (Repository Layer) ───
export {
  ProjectRepository,
  projectRepository,
} from './repositories/ProjectRepository';

export {
  ScenarioRepository,
  scenarioRepository,
} from './repositories/ScenarioRepository';

export {
  RtmRepository,
  rtmRepository,
} from './repositories/RtmRepository';

export {
  SyncQueueRepository,
  syncQueueRepository,
} from './repositories/SyncQueueRepository';
