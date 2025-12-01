import { createClient, SupabaseClient } from '@supabase/supabase-js';

type LocalRow = Record<string, unknown> & { id?: string };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const memoryStore = new Map<string, string>();
const storage = typeof window !== 'undefined' && window.localStorage
  ? window.localStorage
  : {
      getItem: (key: string) => memoryStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryStore.set(key, value);
      },
      removeItem: (key: string) => {
        memoryStore.delete(key);
      },
    };

const tableKey = (table: string) => `corelogic_supabase_${table}`;

const readTable = (table: string): LocalRow[] => {
  const raw = storage.getItem(tableKey(table));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeTable = (table: string, rows: LocalRow[]) => {
  storage.setItem(tableKey(table), JSON.stringify(rows));
};

const ensureId = (row: LocalRow): LocalRow => ({
  ...row,
  id:
    row.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`),
});

const normalizeSortableValue = (value: unknown): string | number => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  return String(value);
};

const createQueryBuilder = (table: string) => {
  let filters: Array<(row: LocalRow) => boolean> = [];
  let orderBy: { column: string; ascending: boolean } | null = null;
  let limitCount: number | null = null;

  const execute = () => {
    let rows = readTable(table);
    if (filters.length) {
      rows = rows.filter((row) => filters.every((fn) => fn(row)));
    }
    if (orderBy) {
      const { column, ascending } = orderBy;
      rows = [...rows].sort((a, b) => {
        const av = normalizeSortableValue(a[column]);
        const bv = normalizeSortableValue(b[column]);
        if (av === bv) return 0;
        let comparison: number;
        if (typeof av === "number" && typeof bv === "number") {
          comparison = av > bv ? 1 : -1;
        } else {
          comparison = String(av).localeCompare(String(bv));
        }
        return ascending ? comparison : -comparison;
      });
    }
    if (typeof limitCount === "number") {
      rows = rows.slice(0, limitCount);
    }
    return rows;
  };

  const builder: any = {
    eq: (column: string, value: unknown) => {
      filters.push((row) => row[column] === value);
      return builder;
    },
    order: (column: string, options?: { ascending?: boolean }) => {
      orderBy = { column, ascending: options?.ascending !== false };
      return builder;
    },
    limit: (count: number) => {
      limitCount = count;
      return builder;
    },
    maybeSingle: async () => {
      const rows = execute();
      return { data: rows[0] ?? null, error: null };
    },
    single: async () => {
      const rows = execute();
      return { data: rows[0] ?? null, error: null };
    },
    then: (
      onFulfilled?: (value: { data: LocalRow[]; error: null }) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => {
      return Promise.resolve()
        .then(() => {
          const result = { data: execute(), error: null as null };
          return onFulfilled ? onFulfilled(result) : (result as unknown);
        })
        .catch((error) => {
          if (onRejected) {
            return onRejected(error);
          }
          throw error;
        });
    },
    catch: (onRejected: (reason: unknown) => unknown) => builder.then(undefined, onRejected),
    finally: (onFinally?: () => void) =>
      builder.then(
        (value: unknown) => Promise.resolve(onFinally?.()).then(() => value),
        (reason: unknown) =>
          Promise.resolve(onFinally?.()).then(() => {
            throw reason;
          })
      ),
  };

  return builder;
};

const createLocalSupabaseClient = () => ({
  from: (table: string) => {
    const selectBuilder = () => createQueryBuilder(table);
    return {
      select: () => selectBuilder(),
      insert: async (payload: LocalRow | LocalRow[]) => {
        const rows = readTable(table);
        const inserts = (Array.isArray(payload) ? payload : [payload]).map(ensureId);
        writeTable(table, [...rows, ...inserts]);
        return { data: inserts, error: null };
      },
      upsert: async (payload: LocalRow | LocalRow[]) => {
        const rows = readTable(table);
        const upserts = (Array.isArray(payload) ? payload : [payload]).map(ensureId);
        const next = [...rows];
        upserts.forEach((record) => {
          const index = next.findIndex((row) => row.id === record.id);
          if (index >= 0) {
            next[index] = { ...next[index], ...record };
          } else {
            next.push(record);
          }
        });
        writeTable(table, next);
        return { data: Array.isArray(payload) ? upserts : upserts[0], error: null };
      },
      update: async (payload: LocalRow, match?: Partial<LocalRow>) => {
        const rows = readTable(table);
        const next = rows.map((row) => {
          const isMatch = match
            ? Object.entries(match).every(([key, value]) => row[key] === value)
            : row.id === payload.id;
          return isMatch ? { ...row, ...payload } : row;
        });
        writeTable(table, next);
        return { data: payload, error: null };
      },
      delete: async (match?: Partial<LocalRow>) => {
        if (!match) {
          writeTable(table, []);
          return { data: null, error: null };
        }
        const rows = readTable(table);
        const filtered = rows.filter(
          (row) => !Object.entries(match).every(([key, value]) => row[key] === value)
        );
        writeTable(table, filtered);
        return { data: null, error: null };
      },
    };
  },
  auth: {
    onAuthStateChange: () => () => {},
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({
      data: {
        user: {
          id: 'local-demo-user',
          email: 'demo@corelogic.local',
        },
      },
      error: null,
    }),
  },
});

let supabase: SupabaseClient<any, any, any>;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } else {
    throw new Error('Supabase credentials not configured');
  }
} catch (error) {
  console.warn('[Supabase] Falling back to local storage client:', error);
  supabase = createLocalSupabaseClient() as unknown as SupabaseClient<any, any, any>;
}

export { supabase };
