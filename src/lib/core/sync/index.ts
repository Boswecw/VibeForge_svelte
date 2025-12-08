/**
 * VibeForge V2 - Sync Module Exports (VF-300)
 *
 * Unified exports for:
 * - IndexedDB offline storage
 * - Sync manager with optimistic updates
 * - WebSocket real-time sync
 *
 * Phase 3 - Track A: Backend Persistence
 */

// IndexedDB offline storage
export {
  workspaceStore,
  contextBlockStore,
  runStore,
  promptTemplateStore,
  syncMetadataStore,
  pendingOperationsStore,
  conflictsStore,
  clearAllData,
  getDatabaseStats,
  openDatabase,
} from './indexedDb';

export type {
  SyncMetadata,
  PendingOperation,
  ConflictResolution,
} from './indexedDb';

// Sync Manager
export {
  saveWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  saveContextBlock,
  saveContextBlock as saveContext, // Alias for backward compatibility
  deleteContextBlock,
  deleteContextBlock as deleteContext, // Alias for backward compatibility
  listContextBlocks,
  listContextBlocks as listContexts, // Alias for backward compatibility
  saveRun,
  listRuns,
  deleteRun,
  savePromptTemplate,
  syncAll,
  isOnline,
  getOnlineStatus,
} from './syncManager';

export type {
  SyncOptions,
  SyncResult,
} from './syncManager';

// WebSocket real-time sync
export {
  WebSocketSync,
  getWebSocketSync,
  initWebSocketSync,
} from './websocket';

export type {
  ResourceUpdate,
  WebSocketMessage,
  WebSocketEventHandler,
} from './websocket';
