/**
 * CoreLogic Studio Actions System
 * REAPER-like command architecture with context-based action registry
 * 
 * Features:
 * - Command ID mapping (e.g., "40044" = "Transport: Play")
 * - Context sections (Main, MIDI Editor, Media Explorer, etc.)
 * - Action dispatch with parameter support
 * - Keyboard shortcut binding
 * - Undo/redo support
 */

export type ActionContext = 'main' | 'midi-editor' | 'media-explorer' | 'mixer' | 'arrange';

export interface ActionMetadata {
  id: string; // Unique action ID (can be numeric like REAPER or string)
  name: string; // Display name
  category: string; // "Transport", "Track", "Item", "Edit", etc.
  description?: string;
  contexts: ActionContext[]; // Where this action applies
  accel?: string; // Default keyboard shortcut (e.g., "space", "ctrl+z")
  canUndo?: boolean; // Whether action supports undo
  requiresSelection?: boolean; // Whether selection is needed
}

export interface ActionPayload {
  [key: string]: any;
}

export type ActionHandler = (payload: ActionPayload) => Promise<void> | void;

/**
 * Central action registry - maps action IDs to handlers
 */
export class ActionRegistry {
  private handlers: Map<string, ActionHandler> = new Map();
  private metadata: Map<string, ActionMetadata> = new Map();
  private contextHandlers: Map<ActionContext, Set<string>> = new Map();

  constructor() {
    this.initializeContexts();
  }

  private initializeContexts() {
    const contexts: ActionContext[] = ['main', 'midi-editor', 'media-explorer', 'mixer', 'arrange'];
    contexts.forEach(ctx => this.contextHandlers.set(ctx, new Set()));
  }

  /**
   * Register an action with metadata and handler
   */
  register(meta: ActionMetadata, handler: ActionHandler) {
    this.handlers.set(meta.id, handler);
    this.metadata.set(meta.id, meta);

    // Register in all applicable contexts
    meta.contexts.forEach(ctx => {
      const set = this.contextHandlers.get(ctx);
      if (set) set.add(meta.id);
    });
  }

  /**
   * Execute an action by ID
   */
  async execute(actionId: string, payload: ActionPayload = {}): Promise<void> {
    const handler = this.handlers.get(actionId);
    if (!handler) {
      console.warn(`Action not found: ${actionId}`);
      return;
    }

    try {
      await handler(payload);
    } catch (error) {
      console.error(`Action failed: ${actionId}`, error);
    }
  }

  /**
   * Get all actions for a context
   */
  getActionsForContext(context: ActionContext): ActionMetadata[] {
    const ids = this.contextHandlers.get(context) || new Set();
    return Array.from(ids)
      .map(id => this.metadata.get(id))
      .filter((meta): meta is ActionMetadata => meta !== undefined);
  }

  /**
   * Search for actions by name or category
   */
  search(query: string): ActionMetadata[] {
    const lower = query.toLowerCase();
    return Array.from(this.metadata.values()).filter(
      meta =>
        meta.name.toLowerCase().includes(lower) ||
        meta.category.toLowerCase().includes(lower) ||
        meta.description?.toLowerCase().includes(lower)
    );
  }

  /**
   * Get action metadata
   */
  getMetadata(actionId: string): ActionMetadata | undefined {
    return this.metadata.get(actionId);
  }

  /**
   * Get all registered actions
   */
  getAllActions(): ActionMetadata[] {
    return Array.from(this.metadata.values());
  }
}

/**
 * Global action registry instance
 */
export const actionRegistry = new ActionRegistry();

/**
 * Action result for undo/redo support
 */
export interface ActionResult {
  success: boolean;
  error?: string;
  undo?: () => Promise<void>;
}

/**
 * Undo/Redo stack
 */
export class ActionHistory {
  private undoStack: Array<() => Promise<void>> = [];
  private redoStack: Array<() => Promise<void>> = [];
  private maxSize = 100;

  record(undoFn: () => Promise<void>) {
    this.undoStack.push(undoFn);
    this.redoStack = []; // Clear redo stack on new action

    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
  }

  async undo() {
    const fn = this.undoStack.pop();
    if (fn) {
      const redoFn = fn;
      await fn();
      this.redoStack.push(redoFn);
    }
  }

  async redo() {
    const fn = this.redoStack.pop();
    if (fn) {
      const undoFn = fn;
      await fn();
      this.undoStack.push(undoFn);
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

/**
 * Keyboard shortcut manager
 */
export interface Shortcut {
  actionId: string;
  keys: string; // e.g., "space", "ctrl+z", "shift+alt+n"
  context: ActionContext;
}

export class ShortcutManager {
  private shortcuts: Map<string, Shortcut> = new Map(); // key combo -> shortcut
  private actionToShortcuts: Map<string, Shortcut[]> = new Map(); // actionId -> shortcuts

  register(shortcut: Shortcut) {
    const key = this.normalizeKey(shortcut.keys);
    this.shortcuts.set(key, shortcut);

    if (!this.actionToShortcuts.has(shortcut.actionId)) {
      this.actionToShortcuts.set(shortcut.actionId, []);
    }
    this.actionToShortcuts.get(shortcut.actionId)!.push(shortcut);
  }

  getShortcut(keys: string): Shortcut | undefined {
    const key = this.normalizeKey(keys);
    return this.shortcuts.get(key);
  }

  getShortcutsForAction(actionId: string): Shortcut[] {
    return this.actionToShortcuts.get(actionId) || [];
  }

  private normalizeKey(keys: string): string {
    return keys.toLowerCase().replace(/\s+/g, '');
  }

  clear() {
    this.shortcuts.clear();
    this.actionToShortcuts.clear();
  }
}

export const actionHistory = new ActionHistory();
export const shortcutManager = new ShortcutManager();
