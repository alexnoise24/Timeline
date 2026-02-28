import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Timeline } from '@/types';

interface OfflineDB extends DBSchema {
  timelines: {
    key: string;
    value: {
      data: Timeline;
      lastSync: number;
      userId: string;
    };
    indexes: { 'by-user': string };
  };
  pendingChanges: {
    key: number;
    value: {
      id?: number;
      type: 'create' | 'update' | 'delete';
      endpoint: string;
      method: string;
      data: any;
      timestamp: number;
    };
  };
  metadata: {
    key: string;
    value: {
      lastFullSync: number;
      userId: string;
    };
  };
}

const DB_NAME = 'lenzu-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Timelines store
      if (!db.objectStoreNames.contains('timelines')) {
        const timelineStore = db.createObjectStore('timelines', { keyPath: 'data._id' });
        timelineStore.createIndex('by-user', 'userId');
      }

      // Pending changes queue
      if (!db.objectStoreNames.contains('pendingChanges')) {
        db.createObjectStore('pendingChanges', { keyPath: 'id', autoIncrement: true });
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'userId' });
      }
    },
  });

  return dbInstance;
}

// Timeline operations
export async function saveTimelineOffline(timeline: Timeline, userId: string): Promise<void> {
  const db = await getDB();
  await db.put('timelines', {
    data: timeline,
    lastSync: Date.now(),
    userId,
  });
}

export async function saveTimelinesOffline(timelines: Timeline[], userId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('timelines', 'readwrite');
  
  for (const timeline of timelines) {
    await tx.store.put({
      data: timeline,
      lastSync: Date.now(),
      userId,
    });
  }
  
  await tx.done;
}

export async function getTimelineOffline(timelineId: string): Promise<Timeline | null> {
  const db = await getDB();
  const record = await db.get('timelines', timelineId);
  return record?.data || null;
}

export async function getTimelinesOffline(userId: string): Promise<Timeline[]> {
  const db = await getDB();
  const records = await db.getAllFromIndex('timelines', 'by-user', userId);
  return records.map(r => r.data);
}

export async function deleteTimelineOffline(timelineId: string): Promise<void> {
  const db = await getDB();
  await db.delete('timelines', timelineId);
}

export async function clearTimelinesOffline(userId: string): Promise<void> {
  const db = await getDB();
  const records = await db.getAllFromIndex('timelines', 'by-user', userId);
  const tx = db.transaction('timelines', 'readwrite');
  
  for (const record of records) {
    await tx.store.delete(record.data._id);
  }
  
  await tx.done;
}

// Pending changes queue
export async function addPendingChange(change: Omit<OfflineDB['pendingChanges']['value'], 'id' | 'timestamp'>): Promise<void> {
  const db = await getDB();
  await db.add('pendingChanges', {
    ...change,
    timestamp: Date.now(),
  });
}

export async function getPendingChanges(): Promise<OfflineDB['pendingChanges']['value'][]> {
  const db = await getDB();
  return db.getAll('pendingChanges');
}

export async function clearPendingChange(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('pendingChanges', id);
}

export async function clearAllPendingChanges(): Promise<void> {
  const db = await getDB();
  await db.clear('pendingChanges');
}

// Metadata operations
export async function updateLastSync(userId: string): Promise<void> {
  const db = await getDB();
  await db.put('metadata', {
    lastFullSync: Date.now(),
    userId,
  });
}

export async function getLastSync(userId: string): Promise<number | null> {
  const db = await getDB();
  const metadata = await db.get('metadata', userId);
  return metadata?.lastFullSync || null;
}

// Utility to check if we have offline data
export async function hasOfflineData(userId: string): Promise<boolean> {
  const db = await getDB();
  const records = await db.getAllFromIndex('timelines', 'by-user', userId);
  return records.length > 0;
}

// Get last sync time formatted
export function formatLastSync(timestamp: number | null): string {
  if (!timestamp) return 'Never';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
